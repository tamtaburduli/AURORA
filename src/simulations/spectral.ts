/**
 * ILLUSTRATIVE SYNTHETIC SPECTRA — hand-built analytic curves for education.
 * Absorption-band positions follow well-known features (O₂-A near 762 nm, H₂O near 940, 1130, 1380
 * and 1870 nm, CO₂ near 2010 nm), but depths and widths are stylised. Surface curves are generic
 * shapes, not library measurements. Nothing here is libRadtran output or an AURORA configuration.
 */
import { mulberry32 } from '../lib/rng';

export const LAMBDA_MIN = 400;
export const LAMBDA_MAX = 2500;
export const STEP = 5;
export const GRID: number[] = Array.from({ length: (LAMBDA_MAX - LAMBDA_MIN) / STEP + 1 }, (_, i) => LAMBDA_MIN + i * STEP);

const g = (l: number, c: number, w: number) => Math.exp(-0.5 * ((l - c) / w) ** 2);
const sig = (l: number, c: number, w: number) => 1 / (1 + Math.exp(-(l - c) / w));

export const ABSORBERS = [
  { id: 'o3', label: 'O₃ (Chappuis)', center: 600, width: 60, depth: 0.03 },
  { id: 'o2', label: 'O₂-A', center: 762, width: 5, depth: 1.4 },
  { id: 'h2o940', label: 'H₂O 940', center: 940, width: 25, depth: 0.8 },
  { id: 'h2o1130', label: 'H₂O 1130', center: 1130, width: 30, depth: 0.9 },
  { id: 'h2o1380', label: 'H₂O 1380', center: 1380, width: 45, depth: 3.5 },
  { id: 'h2o1870', label: 'H₂O 1870', center: 1870, width: 65, depth: 3.5 },
  { id: 'co2', label: 'CO₂ 2010', center: 2010, width: 15, depth: 0.5 },
];

/** Total illustrative optical depth: Rayleigh + Ångström aerosol + gas absorption (scaled by water vapour). */
export function opticalDepth(l: number, aod550 = 0.15, water = 1): number {
  const um = l / 1000;
  const rayleigh = 0.0088 * Math.pow(um, -4.05);
  const aerosol = aod550 * Math.pow(l / 550, -1.3);
  let gas = 0;
  for (const a of ABSORBERS) gas += a.depth * (a.id.startsWith('h2o') ? water : 1) * g(l, a.center, a.width);
  return rayleigh + aerosol + gas;
}

export const transmittance = (l: number, aod550 = 0.15, water = 1, airmass = 2) => Math.exp(-airmass * opticalDepth(l, aod550, water));

export const SURFACES = {
  vegetation: (l: number) =>
    0.04 + 0.05 * g(l, 550, 35) + 0.42 * sig(l, 715, 12) * (1 - 0.55 * sig(l, 1350, 40)) - 0.18 * g(l, 1450, 60) - 0.15 * g(l, 1940, 70) - 0.12 * sig(l, 2200, 80) * sig(l, 1300, 20),
  soil: (l: number) => 0.08 + 0.27 * sig(l, 900, 350) - 0.05 * g(l, 1420, 40) - 0.07 * g(l, 1920, 50) - 0.04 * g(l, 2200, 25),
  water: (l: number) => 0.012 + 0.05 * Math.exp(-(l - 400) / 120),
  snow: (l: number) => Math.max(0.02, 0.96 - 0.25 * sig(l, 950, 120) - 0.25 * g(l, 1030, 30) - 0.35 * g(l, 1250, 50) - 0.55 * sig(l, 1450, 30) + 0.25 * g(l, 1800, 90) - 0.2 * sig(l, 1950, 25)),
  urban: (l: number) => 0.07 + 0.06 * sig(l, 1000, 400) - 0.015 * g(l, 1700, 40),
} as const;
export type SurfaceId = keyof typeof SURFACES;
export const SURFACE_LABELS: Record<SurfaceId, string> = { vegetation: 'Vegetation', soil: 'Bare soil', water: 'Water', snow: 'Snow', urban: 'Urban / asphalt' };
export const SURFACE_COLORS: Record<SurfaceId, string> = { vegetation: '#34e3a4', soil: '#e0a96d', water: '#4f7dff', snow: '#e8eefc', urban: '#9aa6c4' };

export type Objective = 'discriminate' | 'aerosol' | 'water';
export const OBJECTIVE_LABELS: Record<Objective, string> = {
  discriminate: 'Discriminate two surfaces',
  aerosol: 'Retrieve aerosol loading',
  water: 'Retrieve water vapour',
};

export interface Context { objective: Objective; surfaceA: SurfaceId; surfaceB: SurfaceId; aod: number; water: number }

/** Toy sensitivity of the TOA-like signal ρ·T to the objective, divided by a simple noise model. */
export function sensitivity(l: number, c: Context): number {
  const T = transmittance(l, c.aod, c.water);
  const noise = 0.004 + 0.002 * (l > 1000 ? 1 : 0); // SWIR detectors assumed noisier (illustrative)
  if (c.objective === 'discriminate') return (Math.abs(SURFACES[c.surfaceA](l) - SURFACES[c.surfaceB](l)) * T) / noise;
  if (c.objective === 'aerosol') {
    // dR/dτ550 ≈ (dτλ/dτ550)·(c_path − ρ_s): added path radiance minus attenuated surface signal.
    // The two cancel near a "critical" albedo (here 0.25), so dark surfaces at short λ are most informative.
    const dTau = Math.pow(l / 550, -1.3);
    const rho = SURFACES[c.surfaceA](l);
    return (dTau * Math.abs(0.25 - rho) * T * 0.1) / noise;
  }
  // Water vapour: derivative of T with respect to the water scaling factor.
  const dT = Math.abs(transmittance(l, c.aod, c.water * 1.05) - T) / 0.05;
  return (dT * SURFACES[c.surfaceA](l)) / noise;
}

/** Synthetic library of mixed pixels used to measure redundancy between bands. */
export function syntheticLibrary(n = 120, seed = 7): ((l: number) => number)[] {
  const r = mulberry32(seed);
  const ids = Object.keys(SURFACES) as SurfaceId[];
  return Array.from({ length: n }, () => {
    const w = ids.map(() => r() ** 2);
    const s = w.reduce((a, b) => a + b, 0);
    const aod = 0.05 + 0.6 * r();
    const water = 0.5 + r();
    return (l: number) => ids.reduce((acc, id, i) => acc + (w[i] / s) * SURFACES[id](l), 0) * transmittance(l, aod, water);
  });
}

export function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export function correlationMatrix(bands: number[], lib = syntheticLibrary()): number[][] {
  const cols = bands.map((l) => lib.map((f) => f(l)));
  return bands.map((_, i) => bands.map((__, j) => pearson(cols[i], cols[j])));
}

/** Score of a band set for a context: total sensitivity, discounted by redundancy (mean |r| off-diagonal). */
export function scoreSet(bands: number[], c: Context, lib = syntheticLibrary()) {
  const sens = bands.reduce((s, l) => s + sensitivity(l, c), 0);
  const R = correlationMatrix(bands, lib);
  let off = 0, n = 0;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { off += Math.abs(R[i][j]); n++; }
  const redundancy = n ? off / n : 0;
  return { sensitivity: sens, redundancy, score: sens * (1 - 0.5 * redundancy) };
}

/** Toy greedy selection: pick bands one at a time maximising sensitivity × (1 − max |r| with chosen bands). */
export function greedySelect(c: Context, k = 5, minSep = 40, lib = syntheticLibrary()): number[] {
  const candidates = GRID.filter((l) => l % 10 === 0);
  const cols = new Map(candidates.map((l) => [l, lib.map((f) => f(l))]));
  const chosen: number[] = [];
  while (chosen.length < k) {
    let best = -Infinity, bestL = candidates[0];
    for (const l of candidates) {
      if (chosen.some((x) => Math.abs(x - l) < minSep)) continue;
      const maxR = chosen.length ? Math.max(...chosen.map((x) => Math.abs(pearson(cols.get(l)!, cols.get(x)!)))) : 0;
      const v = sensitivity(l, c) * (1 - 0.8 * maxR);
      if (v > best) { best = v; bestL = l; }
    }
    chosen.push(bestL);
  }
  return chosen.sort((a, b) => a - b);
}

/** Approximate visible colour for a wavelength (for spectrum bars). */
export function wavelengthColor(l: number): string {
  if (l < 380 || l > 780) return l > 780 ? '#5a1a2a' : '#2a1a5a';
  let r = 0, gg = 0, b = 0;
  if (l < 440) { r = -(l - 440) / 60; b = 1; }
  else if (l < 490) { gg = (l - 440) / 50; b = 1; }
  else if (l < 510) { gg = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; gg = 1; }
  else if (l < 645) { r = 1; gg = -(l - 645) / 65; }
  else r = 1;
  const f = l > 700 ? 0.3 + (0.7 * (780 - l)) / 80 : l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : 1;
  const c = (x: number) => Math.round(255 * Math.pow(x * f, 0.8));
  return `rgb(${c(r)},${c(gg)},${c(b)})`;
}
