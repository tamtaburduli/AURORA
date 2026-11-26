/**
 * AURORA illustrative adaptive-sensing simulator.
 *
 * ILLUSTRATIVE ONLY — this is a transparent, synthetic, linear-Gaussian toy model written for
 * education. It does not reproduce AURORA's computational experiments and its numbers must not be
 * read as experimental results.
 *
 * Model
 *   hidden state  x ∈ R^4  = [aerosol loading, surface reflectance, moisture, structural state]
 *   evolution     x_{t+1} = x_t + w,  w ~ N(0, q I)            (q = environmental variability)
 *   measurement   y = h_a · x + b_a(t) + ε,  ε ~ N(0, (σ_a·noise)^2)
 *                 b_a(t) = drift · s_a · t  (unmodelled sensor drift; the estimator does not know it)
 *   estimator     Kalman filter: predict P ← P + qI, update with the selected measurement.
 *
 * Strategies (all share the same truth trajectory and the same pre-drawn noise for a given seed)
 *   fixed     — a predetermined cyclic order of the available actions
 *   random    — uniformly random among affordable available actions (separate seeded stream)
 *   adaptive  — greedy: maximise expected information gain per unit cost,
 *               EIG = ½ ln(1 + h P hᵀ / σ²), and stop once uncertainty ≤ threshold
 */
import { mulberry32, gaussian } from '../lib/rng';
import { logdetSPD, trace } from '../lib/linalg';

export const STATE_LABELS = ['Aerosol loading', 'Surface reflectance', 'Moisture', 'Structural state'] as const;
export const D = 4;

export type ModalityId = 'optical' | 'polarimetric' | 'acoustic' | 'microwave' | 'mechanical';

export interface Action {
  id: string;
  label: string;
  modality: ModalityId;
  h: number[];        // sensitivity (Jacobian row) to each state component
  sigma: number;      // baseline noise standard deviation
  cost: number;       // budget units
}

/** Synthetic action catalogue. Sensitivities are chosen to illustrate confounding (the two optical
 *  bands both mix aerosol and surface) and complementarity (polarimetry separates them). */
export const ACTIONS: Action[] = [
  { id: 'opt-vis', label: 'Optical · visible band', modality: 'optical', h: [0.9, 0.45, 0, 0], sigma: 0.12, cost: 1 },
  { id: 'opt-nir', label: 'Optical · near-IR band', modality: 'optical', h: [0.35, 0.95, 0.15, 0], sigma: 0.12, cost: 1 },
  { id: 'pol', label: 'Polarimetric · DoLP', modality: 'polarimetric', h: [0.85, -0.3, 0, 0], sigma: 0.2, cost: 1.5 },
  { id: 'mw', label: 'Microwave · brightness', modality: 'microwave', h: [0, 0.15, 0.9, 0.1], sigma: 0.2, cost: 2 },
  { id: 'ac', label: 'Acoustic · resonance', modality: 'acoustic', h: [0, 0.1, 0.2, 0.9], sigma: 0.25, cost: 2 },
  { id: 'mech', label: 'Mechanical · vibration', modality: 'mechanical', h: [0, 0, 0.1, 0.7], sigma: 0.3, cost: 1.5 },
];

export type Strategy = 'fixed' | 'random' | 'adaptive';
export const STRATEGIES: Strategy[] = ['fixed', 'random', 'adaptive'];

export interface SimParams {
  seed: number;
  budget: number;          // total budget units
  noise: number;           // multiplier on every action's sigma
  variability: number;     // process-noise variance per step, q
  drift: number;           // drift rate (state units per step)
  threshold: number;       // stop when RMS posterior std ≤ threshold (adaptive only)
  modalities: ModalityId[];
  maxSteps?: number;
}

export interface StepRecord {
  step: number;
  actionId: string;
  actionLabel: string;
  cost: number;
  spent: number;
  remaining: number;
  uncertainty: number;     // RMS posterior std = sqrt(tr(P)/D)
  recovery: number;        // 1 − tr(P)/tr(P0)  (fraction of prior variance removed)
  infoBits: number;        // ½ log2(det P0 / det P)
  error: number;           // RMS error of the estimate vs. truth
  eig: number;             // expected information gain of the chosen action (nats)
}

export interface SimResult {
  strategy: Strategy;
  history: StepRecord[];
  stoppedReason: 'threshold' | 'budget' | 'max-steps' | 'no-actions';
  final: StepRecord;
}

const PRIOR_VAR = 1;

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length);
}

export function runStrategy(strategy: Strategy, p: SimParams): SimResult {
  const maxSteps = p.maxSteps ?? 40;
  const actions = ACTIONS.filter((a) => p.modalities.includes(a.modality));

  // Shared randomness: truth, per-step process noise, per-step per-action measurement noise, drift signs.
  const rng = mulberry32(p.seed);
  const x0 = Array.from({ length: D }, () => gaussian(rng) * Math.sqrt(PRIOR_VAR));
  const proc = Array.from({ length: maxSteps }, () => Array.from({ length: D }, () => gaussian(rng)));
  const meas = Array.from({ length: maxSteps }, () => ACTIONS.map(() => gaussian(rng)));
  const driftSign = ACTIONS.map(() => (rng() < 0.5 ? -1 : 1));
  const pick = mulberry32(p.seed ^ 0x9e3779b9);

  let x = [...x0];
  let xhat = Array(D).fill(0);
  let P: number[][] = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? PRIOR_VAR : 0)));
  const tr0 = D * PRIOR_VAR;
  const ld0 = D * Math.log(PRIOR_VAR);

  const snapshot = (step: number, a: Action | null, spent: number, eig: number): StepRecord => ({
    step,
    actionId: a?.id ?? '—',
    actionLabel: a?.label ?? 'Prior (no measurement)',
    cost: a?.cost ?? 0,
    spent,
    remaining: p.budget - spent,
    uncertainty: Math.sqrt(trace(P) / D),
    recovery: Math.max(0, 1 - trace(P) / tr0),
    infoBits: Math.max(0, (0.5 * (ld0 - logdetSPD(P))) / Math.LN2),
    error: rms(x.map((xi, i) => xi - xhat[i])),
    eig,
  });

  const history: StepRecord[] = [snapshot(0, null, 0, 0)];
  let spent = 0;
  let stoppedReason: SimResult['stoppedReason'] = 'max-steps';

  const eigOf = (a: Action, sig2: number) => {
    let hPh = 0;
    for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) hPh += a.h[i] * P[i][j] * a.h[j];
    return 0.5 * Math.log(1 + hPh / sig2);
  };

  for (let t = 0; t < maxSteps; t++) {
    const affordable = actions.filter((a) => a.cost <= p.budget - spent + 1e-9);
    if (actions.length === 0) { stoppedReason = 'no-actions'; break; }
    if (affordable.length === 0) { stoppedReason = 'budget'; break; }
    if (strategy === 'adaptive' && Math.sqrt(trace(P) / D) <= p.threshold) { stoppedReason = 'threshold'; break; }

    // Predict: the environment changes between observations.
    x = x.map((xi, i) => xi + Math.sqrt(p.variability) * proc[t][i]);
    if (p.variability > 0) P = P.map((row, i) => row.map((v, j) => (i === j ? v + p.variability : v)));

    let a: Action;
    if (strategy === 'fixed') {
      // Cycle through the predetermined order, skipping actions that no longer fit the budget.
      const order = actions;
      let k = t % order.length;
      let tries = 0;
      while (order[k].cost > p.budget - spent + 1e-9 && tries < order.length) { k = (k + 1) % order.length; tries++; }
      a = order[k];
    } else if (strategy === 'random') {
      a = affordable[Math.floor(pick() * affordable.length)];
    } else {
      a = affordable
        .map((c) => ({ c, score: eigOf(c, (c.sigma * p.noise) ** 2) / c.cost }))
        .sort((u, v) => v.score - u.score)[0].c;
    }

    const sig = a.sigma * p.noise;
    const sig2 = sig * sig;
    const eig = eigOf(a, sig2);
    const ai = ACTIONS.indexOf(a);
    const bias = p.drift * driftSign[ai] * (t + 1);
    const y = a.h.reduce((s, hi, i) => s + hi * x[i], 0) + bias + sig * meas[t][ai];

    // Kalman update.
    const Ph = P.map((row) => row.reduce((s, v, j) => s + v * a.h[j], 0));
    const S = a.h.reduce((s, hi, i) => s + hi * Ph[i], 0) + sig2;
    const K = Ph.map((v) => v / S);
    const innov = y - a.h.reduce((s, hi, i) => s + hi * xhat[i], 0);
    xhat = xhat.map((v, i) => v + K[i] * innov);
    P = P.map((row, i) => row.map((v, j) => v - K[i] * Ph[j]));
    P = P.map((row, i) => row.map((v, j) => 0.5 * (v + P[j][i]))); // keep symmetric

    spent += a.cost;
    history.push(snapshot(t + 1, a, spent, eig));
  }
  if (strategy === 'adaptive' && stoppedReason === 'max-steps' && Math.sqrt(trace(P) / D) <= p.threshold) stoppedReason = 'threshold';

  return { strategy, history, stoppedReason, final: history[history.length - 1] };
}

export function runAll(p: SimParams): Record<Strategy, SimResult> {
  return { fixed: runStrategy('fixed', p), random: runStrategy('random', p), adaptive: runStrategy('adaptive', p) };
}

export interface MonteCarloRow { strategy: Strategy; meanUncertainty: number; meanError: number; meanSpent: number; meanRecovery: number; runs: number }

/** Repeat over consecutive seeds to show variability of the toy comparison. */
export function monteCarlo(p: SimParams, runs = 100): MonteCarloRow[] {
  return STRATEGIES.map((s) => {
    let u = 0, e = 0, sp = 0, r = 0;
    for (let i = 0; i < runs; i++) {
      const f = runStrategy(s, { ...p, seed: p.seed + i }).final;
      u += f.uncertainty; e += f.error; sp += f.spent; r += f.recovery;
    }
    return { strategy: s, meanUncertainty: u / runs, meanError: e / runs, meanSpent: sp / runs, meanRecovery: r / runs, runs };
  });
}
