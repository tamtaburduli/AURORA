/** In-place iterative radix-2 Cooley–Tukey FFT. Length must be a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n & (n - 1)) throw new Error('FFT length must be a power of two');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

export function hann(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

/** Magnitude spectrum (single-sided, length n/2+1) of one windowed frame. */
export function magnitudeSpectrum(frame: ArrayLike<number>, window: Float64Array): Float64Array {
  const n = window.length;
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = (frame[i] ?? 0) * window[i];
  fft(re, im);
  const out = new Float64Array(n / 2 + 1);
  let wsum = 0;
  for (let i = 0; i < n; i++) wsum += window[i];
  for (let k = 0; k <= n / 2; k++) out[k] = (Math.hypot(re[k], im[k]) * 2) / wsum;
  return out;
}

/** Welch-averaged magnitude spectrum over the whole signal. */
export function averagedSpectrum(signal: Float32Array | Float64Array, n = 8192, hop = n / 2): Float64Array {
  const w = hann(n);
  const acc = new Float64Array(n / 2 + 1);
  let frames = 0;
  if (signal.length < n) {
    const pad = new Float64Array(n); pad.set(signal);
    return magnitudeSpectrum(pad, w);
  }
  for (let s = 0; s + n <= signal.length; s += hop) {
    const m = magnitudeSpectrum(signal.subarray(s, s + n), w);
    for (let k = 0; k < m.length; k++) acc[k] += m[k] * m[k];
    frames++;
  }
  for (let k = 0; k < acc.length; k++) acc[k] = Math.sqrt(acc[k] / frames);
  return acc;
}

export interface Peak { freq: number; magnitude: number; db: number }

/** Local maxima above a dB threshold relative to the strongest bin, refined by parabolic interpolation. */
export function findPeaks(spec: Float64Array, sampleRate: number, opts: { maxPeaks?: number; minDb?: number; minFreq?: number } = {}): Peak[] {
  const { maxPeaks = 8, minDb = -40, minFreq = 20 } = opts;
  const n = (spec.length - 1) * 2;
  const binHz = sampleRate / n;
  let max = 0;
  for (let k = 1; k < spec.length; k++) max = Math.max(max, spec[k]);
  if (max === 0) return [];
  const peaks: Peak[] = [];
  for (let k = 2; k < spec.length - 2; k++) {
    const v = spec[k];
    if (k * binHz < minFreq) continue;
    if (v > spec[k - 1] && v >= spec[k + 1] && v > spec[k - 2] && v >= spec[k + 2]) {
      const db = 20 * Math.log10(v / max);
      if (db < minDb) continue;
      const a = Math.log(spec[k - 1] + 1e-20), b = Math.log(v + 1e-20), c = Math.log(spec[k + 1] + 1e-20);
      const p = (0.5 * (a - c)) / (a - 2 * b + c || 1e-20);
      peaks.push({ freq: (k + p) * binHz, magnitude: v, db });
    }
  }
  return peaks.sort((x, y) => y.magnitude - x.magnitude).slice(0, maxPeaks);
}

/** Short-time spectrogram in dB, frames × bins. */
export function spectrogram(signal: Float32Array | Float64Array, n = 1024, hop = 256, maxFrames = 600): { data: Float64Array[]; hop: number } {
  const totalFrames = Math.max(1, Math.floor((signal.length - n) / hop) + 1);
  const effHop = totalFrames > maxFrames ? Math.ceil((signal.length - n) / (maxFrames - 1)) : hop;
  const w = hann(n);
  const data: Float64Array[] = [];
  for (let s = 0; s + n <= signal.length; s += effHop) {
    const m = magnitudeSpectrum(signal.subarray(s, s + n), w);
    for (let k = 0; k < m.length; k++) m[k] = 20 * Math.log10(m[k] + 1e-9);
    data.push(m);
  }
  return { data, hop: effHop };
}

/** Onset/transient detection: half-wave-rectified spectral flux above max(median + k·MAD, relMin × peak flux). */
export function detectTransients(signal: Float32Array | Float64Array, sampleRate: number, n = 1024, hop = 512, k = 4, relMin = 0.15): number[] {
  const w = hann(n);
  let prev: Float64Array | null = null;
  const flux: number[] = [];
  for (let s = 0; s + n <= signal.length; s += hop) {
    const m = magnitudeSpectrum(signal.subarray(s, s + n), w);
    let f = 0;
    if (prev) for (let i = 0; i < m.length; i++) f += Math.max(0, m[i] - prev[i]);
    flux.push(f);
    prev = m;
  }
  if (flux.length < 3) return [];
  const sorted = [...flux].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  const mad = [...flux.map((f) => Math.abs(f - med))].sort((a, b) => a - b)[Math.floor(flux.length / 2)] || 1e-12;
  const thr = Math.max(med + k * mad, relMin * Math.max(...flux));
  const times: number[] = [];
  let last = -Infinity;
  for (let i = 1; i < flux.length - 1; i++) {
    if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) {
      const t = (i * hop + n / 2) / sampleRate;
      if (t - last > 0.05) { times.push(t); last = t; }
    }
  }
  return times;
}

/** Energy in logarithmically spaced bands (dB, normalized to the loudest band): a compact frequency-response fingerprint. */
export function bandFingerprint(spec: Float64Array, sampleRate: number, bands = 24, fMin = 50, fMax = 16000): { center: number; db: number }[] {
  const n = (spec.length - 1) * 2;
  const binHz = sampleRate / n;
  const top = Math.min(fMax, sampleRate / 2);
  const edges = Array.from({ length: bands + 1 }, (_, i) => fMin * Math.pow(top / fMin, i / bands));
  const e = edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    let s = 0;
    for (let k = Math.ceil(lo / binHz); k <= Math.min(spec.length - 1, Math.floor(hi / binHz)); k++) s += spec[k] * spec[k];
    return { center: Math.sqrt(lo * hi), e: s };
  });
  const max = Math.max(...e.map((x) => x.e), 1e-30);
  return e.map((x) => ({ center: x.center, db: Math.max(-60, 10 * Math.log10(x.e / max + 1e-12)) }));
}

/** Cosine similarity between two fingerprints (dB values shifted to be non-negative). */
export function fingerprintSimilarity(a: { db: number }[], b: { db: number }[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i].db + 60, y = b[i].db + 60;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
