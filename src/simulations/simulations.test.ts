import { describe, it, expect } from 'vitest';
import { inverse, matmul, eye, logdetSPD } from '../lib/linalg';
import { fft, averagedSpectrum, findPeaks, detectTransients } from '../lib/fft';
import { mulberry32 } from '../lib/rng';
import { runAll, runStrategy, ACTIONS, type SimParams } from './adaptiveSensing';
import { toaReflectance, albedoFor } from './toyRadiative';
import { greedySelect, correlationMatrix } from './spectral';

const base: SimParams = {
  seed: 42, budget: 8, noise: 1, variability: 0, drift: 0, threshold: 0.3,
  modalities: ['optical', 'polarimetric', 'acoustic', 'microwave', 'mechanical'],
};

describe('linear algebra', () => {
  it('inverts a matrix', () => {
    const A = [[4, 1, 0], [1, 3, 1], [0, 1, 2]];
    const I = matmul(A, inverse(A));
    I.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(i === j ? 1 : 0, 10)));
  });
  it('computes log-determinant', () => {
    expect(logdetSPD([[2, 0], [0, 3]])).toBeCloseTo(Math.log(6), 12);
    expect(logdetSPD(eye(4))).toBeCloseTo(0, 12);
  });
});

describe('rng', () => {
  it('is reproducible', () => {
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
});

describe('FFT and acoustic analysis', () => {
  it('matches a direct DFT', () => {
    const n = 16, re = new Float64Array(n), im = new Float64Array(n);
    const x = Array.from({ length: n }, (_, i) => Math.sin(i) + 0.3 * i);
    x.forEach((v, i) => (re[i] = v));
    fft(re, im);
    for (let k = 0; k < n; k++) {
      let r = 0, m = 0;
      for (let t = 0; t < n; t++) { r += x[t] * Math.cos((-2 * Math.PI * k * t) / n); m += x[t] * Math.sin((-2 * Math.PI * k * t) / n); }
      expect(re[k]).toBeCloseTo(r, 8); expect(im[k]).toBeCloseTo(m, 8);
    }
  });
  it('finds the frequency of a pure tone', () => {
    const sr = 44100, sig = new Float32Array(sr);
    for (let i = 0; i < sr; i++) sig[i] = Math.sin((2 * Math.PI * 1234 * i) / sr);
    const peaks = findPeaks(averagedSpectrum(sig), sr, { maxPeaks: 1 });
    expect(Math.abs(peaks[0].freq - 1234)).toBeLessThan(2);
  });
  it('detects an impulsive transient', () => {
    const sr = 22050, sig = new Float32Array(sr);
    for (let i = 0; i < sr; i++) sig[i] = 0.001 * Math.sin(i);
    for (let i = 11025; i < 11025 + 2000; i++) sig[i] += Math.exp(-(i - 11025) / 300) * Math.sin((2 * Math.PI * 800 * i) / sr);
    const t = detectTransients(sig, sr);
    expect(t.some((x) => Math.abs(x - 0.5) < 0.05)).toBe(true);
  });
});

describe('illustrative simulator', () => {
  it('is deterministic for a fixed seed', () => {
    expect(runAll(base)).toEqual(runAll(base));
  });
  it('never exceeds the measurement budget', () => {
    for (const s of ['fixed', 'random', 'adaptive'] as const) {
      const r = runStrategy(s, { ...base, threshold: 0 });
      expect(r.final.spent).toBeLessThanOrEqual(base.budget + 1e-9);
    }
  });
  it('reduces posterior uncertainty monotonically without process noise', () => {
    const h = runStrategy('adaptive', { ...base, threshold: 0 }).history;
    for (let i = 1; i < h.length; i++) expect(h[i].uncertainty).toBeLessThanOrEqual(h[i - 1].uncertainty + 1e-12);
  });
  it('only uses enabled modalities', () => {
    const r = runStrategy('random', { ...base, modalities: ['optical'] });
    const allowed = ACTIONS.filter((a) => a.modality === 'optical').map((a) => a.id);
    r.history.slice(1).forEach((s) => expect(allowed).toContain(s.actionId));
  });
  it('adaptive stops at the threshold', () => {
    const r = runStrategy('adaptive', { ...base, budget: 30, threshold: 0.5 });
    expect(r.stoppedReason).toBe('threshold');
    expect(r.final.uncertainty).toBeLessThanOrEqual(0.5);
  });
});

describe('toy radiative model', () => {
  it('analytic inverse recovers albedo', () => {
    const R = toaReflectance(650, 0.35, 0.2, 25, 0.95);
    expect(albedoFor(650, 0.35, R, 25, 0.95)).toBeCloseTo(0.2, 10);
  });
});

describe('spectral toy model', () => {
  it('greedy selection returns five separated bands', () => {
    const b = greedySelect({ objective: 'discriminate', surfaceA: 'vegetation', surfaceB: 'soil', aod: 0.15, water: 1 });
    expect(b).toHaveLength(5);
    for (let i = 1; i < b.length; i++) expect(b[i] - b[i - 1]).toBeGreaterThanOrEqual(40);
  });
  it('correlation matrix has unit diagonal', () => {
    const R = correlationMatrix([450, 650, 850]);
    R.forEach((row, i) => expect(row[i]).toBeCloseTo(1, 10));
  });
});
