import { useMemo, useState } from 'react';
import { Slider } from '../components/ui';
import { SURFACES, transmittance } from '../simulations/spectral';

const VW = 520, VH = 220, PL = 40, PR = 12, PT = 12, PB = 30;

function Plot({ series, xLabel, yLabel, xDomain, yDomain, aria }: {
  series: { pts: [number, number][]; color: string; dash?: string; label?: string }[];
  xLabel: string; yLabel: string; xDomain: [number, number]; yDomain: [number, number]; aria: string;
}) {
  const sx = (v: number) => PL + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (VW - PL - PR);
  const sy = (v: number) => PT + (1 - (v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (VH - PT - PB);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full" role="img" aria-label={aria}>
      {[0, 0.5, 1].map((f) => <line key={f} x1={PL} x2={VW - PR} y1={PT + f * (VH - PT - PB)} y2={PT + f * (VH - PT - PB)} stroke="rgba(255,255,255,0.06)" />)}
      <line x1={PL} x2={PL} y1={PT} y2={VH - PB} stroke="rgba(255,255,255,0.2)" />
      <line x1={PL} x2={VW - PR} y1={VH - PB} y2={VH - PB} stroke="rgba(255,255,255,0.2)" />
      <text x={(VW + PL) / 2} y={VH - 6} fill="#8b97b5" fontSize="11" textAnchor="middle">{xLabel}</text>
      <text x={12} y={(VH - PB) / 2} fill="#8b97b5" fontSize="11" textAnchor="middle" transform={`rotate(-90 12 ${(VH - PB) / 2})`}>{yLabel}</text>
      <text x={PL} y={VH - PB + 13} fill="#6f7c9c" fontSize="9">{xDomain[0]}</text>
      <text x={VW - PR} y={VH - PB + 13} fill="#6f7c9c" fontSize="9" textAnchor="end">{xDomain[1]}</text>
      {series.map((s, i) => (
        <path key={i} d={s.pts.map(([a, b], j) => `${j ? 'L' : 'M'}${sx(a).toFixed(1)} ${sy(Math.max(yDomain[0], Math.min(yDomain[1], b))).toFixed(1)}`).join('')} stroke={s.color} strokeWidth="1.8" fill="none" strokeDasharray={s.dash} />
      ))}
    </svg>
  );
}

function OpticalDemo() {
  const [aod, setAod] = useState(0.15);
  const pts = (f: (l: number) => number): [number, number][] => Array.from({ length: 121 }, (_, i) => { const l = 400 + i * 5; return [l, f(l)]; });
  return (
    <div>
      <Plot aria="Illustrative apparent reflectance of vegetation and soil through the atmosphere" xLabel="Wavelength (nm)" yLabel="Apparent reflectance" xDomain={[400, 1000]} yDomain={[0, 0.5]}
        series={[
          { pts: pts((l) => SURFACES.vegetation(l) * transmittance(l, aod, 1)), color: '#34e3a4' },
          { pts: pts((l) => SURFACES.soil(l) * transmittance(l, aod, 1)), color: '#e0a96d' },
          { pts: pts((l) => SURFACES.vegetation(l)), color: '#34e3a4', dash: '3 4' },
        ]} />
      <Slider label="Aerosol optical depth" value={aod} min={0} max={1} step={0.01} onChange={setAod} format={(v) => v.toFixed(2)} />
      <p className="mt-2 text-xs text-slate-500">Synthetic. Dashed: vegetation at the surface. Solid: attenuated by an illustrative atmosphere (green vegetation, tan soil).</p>
    </div>
  );
}

function PolarizationDemo() {
  const [depol, setDepol] = useState(0.4);
  const pts: [number, number][] = Array.from({ length: 91 }, (_, i) => { const t = i * 2; const c = Math.cos((t * Math.PI) / 180); return [t, (1 - c * c) / (1 + c * c)]; });
  const mixed: [number, number][] = pts.map(([t, p]) => [t, p * (1 - depol)]);
  return (
    <div>
      <Plot aria="Degree of linear polarization versus scattering angle for Rayleigh scattering with and without a depolarizing surface contribution" xLabel="Scattering angle (°)" yLabel="Degree of linear polarization" xDomain={[0, 180]} yDomain={[0, 1]}
        series={[{ pts, color: '#9d7bff', dash: '3 4' }, { pts: mixed, color: '#3fd6f0' }]} />
      <Slider label="Fraction of signal from a depolarizing surface" value={depol} min={0} max={0.95} step={0.01} onChange={setDepol} format={(v) => `${Math.round(v * 100)}%`} />
      <p className="mt-2 text-xs text-slate-500">Dashed: single Rayleigh scattering, P = sin²Θ / (1 + cos²Θ). Solid: diluted by an unpolarized surface contribution. Simplified physics.</p>
    </div>
  );
}

const MATERIALS = { Aluminium: { f0: 1800, Q: 120 }, Glass: { f0: 1250, Q: 60 }, Wood: { f0: 420, Q: 12 }, Polymer: { f0: 700, Q: 6 } } as const;
function ResonanceDemo() {
  const [m, setM] = useState<keyof typeof MATERIALS>('Glass');
  const curves = useMemo(() => (Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).map((k) => {
    const { f0, Q } = MATERIALS[k];
    const pts: [number, number][] = Array.from({ length: 200 }, (_, i) => { const f = 50 + i * 15; const H = 1 / Math.sqrt((f0 * f0 - f * f) ** 2 + ((f * f0) / Q) ** 2); return [f, 20 * Math.log10(H * f0 * f0 / Q)]; });
    return { k, pts };
  }), []);
  const color: Record<string, string> = { Aluminium: '#e8eefc', Glass: '#3fd6f0', Wood: '#e0a96d', Polymer: '#9d7bff' };
  return (
    <div>
      <Plot aria="Frequency response of single-mode resonators with different stiffness and damping" xLabel="Frequency (Hz)" yLabel="Response (dB, relative)" xDomain={[50, 3035]} yDomain={[-50, 5]}
        series={curves.map((c) => ({ pts: c.pts, color: color[c.k], dash: c.k === m ? undefined : '2 5' }))} />
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Highlight material">
        {(Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={k === m} onClick={() => setM(k)} className={`focus-ring rounded-full border px-3 py-1 text-xs ${k === m ? 'border-white/40 text-slate-100' : 'border-white/10 text-slate-500'}`}>{k}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Hypothetical single-mode resonators with invented resonant frequencies and quality factors, chosen to show how stiffness and damping shape a fingerprint. Not measured values.</p>
    </div>
  );
}

function DielectricDemo() {
  const [mc, setMc] = useState(0.15);
  const emis = (m: number) => { const e = 3 + 70 * m * m + 10 * m; const r = ((1 - Math.sqrt(e)) / (1 + Math.sqrt(e))) ** 2; return 1 - r; };
  const pts: [number, number][] = Array.from({ length: 51 }, (_, i) => [i * 0.01, emis(i * 0.01)]);
  return (
    <div>
      <Plot aria="Toy microwave emissivity at normal incidence versus volumetric soil moisture" xLabel="Volumetric moisture (m³/m³)" yLabel="Emissivity (normal incidence)" xDomain={[0, 0.5]} yDomain={[0.5, 1]}
        series={[{ pts, color: '#4f7dff' }, { pts: [[mc, 0.5], [mc, 1]], color: '#e8eefc', dash: '3 3' }]} />
      <Slider label="Moisture" value={mc} min={0} max={0.5} step={0.01} onChange={setMc} format={(v) => `${v.toFixed(2)} → ε ≈ ${emis(v).toFixed(3)}`} />
      <p className="mt-2 text-xs text-slate-500">Toy Fresnel emissivity with an invented moisture–permittivity relation. Shows why liquid water strongly affects microwave observations; not a calibrated dielectric model.</p>
    </div>
  );
}

function OscillatorDemo() {
  const [loss, setLoss] = useState(0);
  const f0 = 6, f1 = f0 * Math.sqrt(1 - loss);
  const sig = (f: number): [number, number][] => Array.from({ length: 300 }, (_, i) => { const t = i / 100; return [t, Math.exp(-0.6 * t) * Math.cos(2 * Math.PI * f * t)]; });
  return (
    <div>
      <Plot aria="Free vibration of a structure before and after a stiffness reduction" xLabel="Time (s)" yLabel="Displacement (relative)" xDomain={[0, 3]} yDomain={[-1, 1]}
        series={[{ pts: sig(f0), color: '#9aa6c4', dash: '3 4' }, { pts: sig(f1), color: '#f5c451' }]} />
      <Slider label="Stiffness reduction" value={loss} min={0} max={0.5} step={0.01} onChange={setLoss} format={(v) => `${Math.round(v * 100)}% → f = ${f1.toFixed(2)} Hz`} />
      <p className="mt-2 text-xs text-slate-500">Single-degree-of-freedom oscillator, f = (1/2π)√(k/m). A stiffness change shifts the natural frequency. Illustrative only.</p>
    </div>
  );
}

export const DEMOS: Record<string, () => JSX.Element> = {
  spectrum: OpticalDemo, polarization: PolarizationDemo, resonance: ResonanceDemo, dielectric: DielectricDemo, oscillator: OscillatorDemo,
};
