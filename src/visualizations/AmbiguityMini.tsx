import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { albedoFor, toaReflectance } from '../simulations/toyRadiative';

export const WL_COLORS: Record<number, string> = { 450: '#4f7dff', 550: '#34e3a4', 650: '#f5c451', 750: '#ff8a6b', 850: '#9d7bff', 950: '#e8eefc' };

export function ambiguityCurves(truth: { tau: number; albedo: number; sza: number; mu: number }, wavelengths: number[]) {
  const taus = Array.from({ length: 71 }, (_, i) => +(i * 0.01).toFixed(2));
  return taus.map((t) => {
    const row: Record<string, number | null> = { tau: t };
    for (const l of wavelengths) {
      const R = toaReflectance(l, truth.tau, truth.albedo, truth.sza, truth.mu);
      row[`w${l}`] = albedoFor(l, t, R, truth.sza, truth.mu);
    }
    return row;
  });
}

export function AmbiguityChart({ truth, wavelengths, height = 300 }: { truth: { tau: number; albedo: number; sza: number; mu: number }; wavelengths: number[]; height?: number }) {
  const data = useMemo(() => ambiguityCurves(truth, wavelengths), [truth, wavelengths]);
  return (
    <div style={{ height }} role="img" aria-label={`Curves of aerosol optical depth and surface albedo pairs consistent with observations at ${wavelengths.join(', ')} nanometres in a toy model.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 22, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="tau" type="number" domain={[0, 0.7]} tick={{ fill: '#8b97b5', fontSize: 11 }} label={{ value: 'Aerosol optical depth at 550 nm', position: 'insideBottom', offset: -12, fill: '#8b97b5', fontSize: 11 }} />
          <YAxis domain={[(lo: number) => Math.max(0, +(lo - 0.05).toFixed(2)), (hi: number) => Math.min(1, +(hi + 0.05).toFixed(2))]} tick={{ fill: '#8b97b5', fontSize: 11 }} label={{ value: 'Surface albedo', angle: -90, position: 'insideLeft', fill: '#8b97b5', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#070d1f', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : String(v))} labelFormatter={(l) => `τ550 = ${l}`} />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
          {wavelengths.map((l) => (
            <Line key={l} dataKey={`w${l}`} name={`${l} nm`} stroke={WL_COLORS[l] ?? '#3fd6f0'} dot={false} strokeWidth={2} connectNulls={false} isAnimationActive={false} />
          ))}
          <ReferenceDot x={truth.tau} y={truth.albedo} r={5} fill="#03050b" stroke="#e8eefc" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AmbiguityMini() {
  const truth = useMemo(() => ({ tau: 0.35, albedo: 0.2, sza: 25, mu: 0.95 }), []);
  const wl = useMemo(() => [450, 850], []);
  return <AmbiguityChart truth={truth} wavelengths={wl} />;
}
