import { useEffect, useRef } from 'react';
import type { Peak } from '../lib/fft';

const INFERNO = [[0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99], [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164]];
function cmap(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t)) * (INFERNO.length - 1);
  const i = Math.floor(x), f = x - i;
  const a = INFERNO[i], b = INFERNO[Math.min(i + 1, INFERNO.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth, h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      const ctx = c.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h);
    };
    render();
    const ro = new ResizeObserver(render); ro.observe(c);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

export function Waveform({ signal, sampleRate, transients, color, label }: { signal: Float32Array; sampleRate: number; transients: number[]; color: string; label: string }) {
  const ref = useCanvas((ctx, w, h) => {
    const per = Math.max(1, Math.floor(signal.length / w));
    let peak = 1e-9; for (let i = 0; i < signal.length; i++) peak = Math.max(peak, Math.abs(signal[i]));
    ctx.fillStyle = color;
    for (let x = 0; x < w; x++) {
      let mn = 1, mx = -1;
      for (let i = x * per; i < Math.min(signal.length, (x + 1) * per); i++) { const v = signal[i] / peak; if (v < mn) mn = v; if (v > mx) mx = v; }
      ctx.fillRect(x, h / 2 - (mx * h) / 2.2, 1, Math.max(1, ((mx - mn) * h) / 2.2));
    }
    ctx.strokeStyle = 'rgba(255,138,107,0.9)'; ctx.lineWidth = 1;
    const dur = signal.length / sampleRate;
    for (const t of transients) { const x = (t / dur) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = '#6f7c9c'; ctx.font = '10px Inter, sans-serif';
    ctx.fillText('0 s', 2, h - 3); ctx.textAlign = 'right'; ctx.fillText(`${dur.toFixed(2)} s`, w - 2, h - 3);
  }, [signal, transients, color]);
  return <canvas ref={ref} className="h-28 w-full rounded-lg bg-void/60" role="img" aria-label={label} />;
}

export function Spectrogram({ data, sampleRate, hop, maxFreq, label }: { data: Float64Array[]; sampleRate: number; hop: number; maxFreq: number; label: string }) {
  const ref = useCanvas((ctx, w, h) => {
    if (!data.length) return;
    const bins = data[0].length;
    const nyq = sampleRate / 2;
    const top = Math.min(bins - 1, Math.floor((maxFreq / nyq) * (bins - 1)));
    let max = -Infinity; for (const f of data) for (let k = 0; k <= top; k++) max = Math.max(max, f[k]);
    const min = max - 80;
    const img = ctx.createImageData(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
    for (let x = 0; x < img.width; x++) {
      const f = data[Math.min(data.length - 1, Math.floor((x / img.width) * data.length))];
      for (let y = 0; y < img.height; y++) {
        const k = Math.floor(((img.height - 1 - y) / img.height) * top);
        const [r, g, b] = cmap((f[k] - min) / (max - min));
        const o = (y * img.width + x) * 4;
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(232,238,252,0.8)'; ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`${(maxFreq / 1000).toFixed(1)} kHz`, 4, 12); ctx.fillText('0 Hz', 4, h - 4);
    ctx.textAlign = 'right'; ctx.fillText(`${((data.length * hop) / sampleRate).toFixed(2)} s`, w - 4, h - 4);
  }, [data, maxFreq]);
  return <canvas ref={ref} className="h-48 w-full rounded-lg bg-void" role="img" aria-label={label} />;
}

export function SpectrumView({ series, sampleRate, peaks, maxFreq }: {
  series: { spec: Float64Array; color: string; name: string }[]; sampleRate: number; peaks?: Peak[]; maxFreq: number;
}) {
  const VW = 800, VH = 270, PL = 44, PR = 10, PT = 22, PB = 28;
  const fMin = 20, fMax = Math.min(maxFreq, sampleRate / 2);
  const sx = (f: number) => PL + (Math.log10(Math.max(f, fMin) / fMin) / Math.log10(fMax / fMin)) * (VW - PL - PR);
  const sy = (db: number) => PT + (-db / 90) * (VH - PT - PB);
  const ticks = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter((f) => f <= fMax);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label="Frequency spectrum in decibels on a logarithmic frequency axis">
      {[0, -30, -60, -90].map((d) => <g key={d}><line x1={PL} x2={VW - PR} y1={sy(d)} y2={sy(d)} stroke="rgba(255,255,255,0.06)" /><text x={PL - 6} y={sy(d) + 3} fill="#6f7c9c" fontSize="10" textAnchor="end">{d}</text></g>)}
      {ticks.map((f) => <g key={f}><line x1={sx(f)} x2={sx(f)} y1={PT} y2={VH - PB} stroke="rgba(255,255,255,0.04)" /><text x={sx(f)} y={VH - PB + 14} fill="#6f7c9c" fontSize="10" textAnchor="middle">{f >= 1000 ? `${f / 1000}k` : f}</text></g>)}
      <text x={(VW + PL) / 2} y={VH - 2} fill="#8b97b5" fontSize="10" textAnchor="middle">Frequency (Hz, log scale)</text>
      <text x={10} y={VH / 2} fill="#8b97b5" fontSize="10" textAnchor="middle" transform={`rotate(-90 10 ${VH / 2})`}>dB re. max</text>
      {series.map((s) => {
        const n = (s.spec.length - 1) * 2, bin = sampleRate / n;
        let max = 1e-20; for (let k = 1; k < s.spec.length; k++) max = Math.max(max, s.spec[k]);
        let d = '', started = false;
        const step = Math.max(1, Math.floor(s.spec.length / 3000));
        for (let k = 1; k < s.spec.length; k += step) {
          const f = k * bin; if (f < fMin || f > fMax) continue;
          const db = Math.max(-90, 20 * Math.log10(s.spec[k] / max + 1e-12));
          d += `${started ? 'L' : 'M'}${sx(f).toFixed(1)} ${sy(db).toFixed(1)}`; started = true;
        }
        return <path key={s.name} d={d} stroke={s.color} strokeWidth="1.2" fill="none" strokeOpacity="0.9" />;
      })}
      {peaks?.map((p, i) => p.freq <= fMax && (
        <g key={i}><circle cx={sx(p.freq)} cy={sy(p.db)} r="3.5" fill="none" stroke="#f5c451" /><text x={sx(p.freq)} y={sy(p.db) - 7} fill="#f5c451" fontSize="9" textAnchor="middle">{p.freq.toFixed(0)}</text></g>
      ))}
    </svg>
  );
}

export function FingerprintBars({ a, b }: { a: { center: number; db: number }[]; b?: { center: number; db: number }[] }) {
  const VW = 800, VH = 200, PL = 36, PB = 26, PT = 8;
  const n = a.length, bw = (VW - PL - 8) / n;
  const sy = (db: number) => PT + (-db / 60) * (VH - PT - PB);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label="Band-energy fingerprint in logarithmically spaced frequency bands">
      {[0, -20, -40, -60].map((d) => <g key={d}><line x1={PL} x2={VW - 8} y1={sy(d)} y2={sy(d)} stroke="rgba(255,255,255,0.06)" /><text x={PL - 6} y={sy(d) + 3} fill="#6f7c9c" fontSize="10" textAnchor="end">{d}</text></g>)}
      {a.map((x, i) => (
        <g key={i}>
          <rect x={PL + i * bw + 1} y={sy(x.db)} width={(b ? bw / 2 : bw) - 2} height={VH - PB - sy(x.db)} fill="#3fd6f0" opacity="0.85" rx="1.5" />
          {b && <rect x={PL + i * bw + bw / 2} y={sy(b[i].db)} width={bw / 2 - 2} height={VH - PB - sy(b[i].db)} fill="#9d7bff" opacity="0.85" rx="1.5" />}
          {i % 3 === 0 && <text x={PL + i * bw + bw / 2} y={VH - PB + 14} fill="#6f7c9c" fontSize="9" textAnchor="middle">{x.center >= 1000 ? `${(x.center / 1000).toFixed(1)}k` : x.center.toFixed(0)}</text>}
        </g>
      ))}
    </svg>
  );
}
