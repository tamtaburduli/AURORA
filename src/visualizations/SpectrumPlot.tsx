import { useMemo, useRef } from 'react';
import { GRID, LAMBDA_MAX, LAMBDA_MIN, SURFACES, SURFACE_COLORS, transmittance, sensitivity, wavelengthColor, ABSORBERS, type Context, type SurfaceId } from '../simulations/spectral';

const VW = 900, VH = 360, PL = 48, PR = 16, PT = 30, PB = 40;
const x = (l: number) => PL + ((l - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN)) * (VW - PL - PR);
const y = (v: number) => PT + (1 - v) * (VH - PT - PB);
const inv = (px: number) => LAMBDA_MIN + ((px - PL) / (VW - PL - PR)) * (LAMBDA_MAX - LAMBDA_MIN);

export interface Layers { transmittance: boolean; surfaces: SurfaceId[]; sensitivity: boolean; absorbers: boolean }

export default function SpectrumPlot({ ctx, bands, active, onPlace, layers, compareBands }: {
  ctx: Context; bands: number[]; active: number; onPlace: (l: number) => void; layers: Layers; compareBands?: number[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tPath = useMemo(() => GRID.map((l, i) => `${i ? 'L' : 'M'}${x(l).toFixed(1)} ${y(transmittance(l, ctx.aod, ctx.water)).toFixed(1)}`).join(''), [ctx.aod, ctx.water]);
  const sens = useMemo(() => {
    const v = GRID.map((l) => sensitivity(l, ctx));
    const m = Math.max(...v, 1e-9);
    return { norm: v.map((s) => s / m) };
  }, [ctx]);
  const sPath = sens.norm.map((v, i) => `${i ? 'L' : 'M'}${x(GRID[i]).toFixed(1)} ${y(v * 0.9).toFixed(1)}`).join('');
  const sArea = `${sPath}L${x(LAMBDA_MAX)} ${y(0)}L${x(LAMBDA_MIN)} ${y(0)}Z`;

  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * VW;
    if (px < PL || px > VW - PR) return;
    onPlace(Math.round(inv(px) / 5) * 5);
  };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="h-auto w-full cursor-crosshair select-none" onClick={click}
      role="img" aria-label="Illustrative spectrum from 400 to 2500 nanometres showing atmospheric transmittance, surface reflectance, objective sensitivity, and five selected channels. Click to move the active channel.">
      <defs>
        <linearGradient id="sensg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9d7bff" stopOpacity="0.45" /><stop offset="1" stopColor="#9d7bff" stopOpacity="0" /></linearGradient>
      </defs>
      {/* visible-colour strip */}
      {GRID.filter((l) => l % 10 === 0).map((l) => (
        <rect key={l} x={x(l)} y={PT - 18} width={x(l + 10) - x(l) + 0.5} height={8} fill={wavelengthColor(l)} opacity={l > 780 ? 0.35 : 0.9} />
      ))}
      <text x={x(400)} y={PT - 22} fill="#8b97b5" fontSize="10">visible</text>
      <text x={x(800)} y={PT - 22} fill="#8b97b5" fontSize="10">near-infrared</text>
      <text x={x(1400)} y={PT - 22} fill="#8b97b5" fontSize="10">shortwave infrared</text>

      {/* axes */}
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}><line x1={PL} x2={VW - PR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" /><text x={PL - 8} y={y(v) + 3} fill="#6f7c9c" fontSize="10" textAnchor="end">{v}</text></g>
      ))}
      {[400, 700, 1000, 1300, 1600, 1900, 2200, 2500].map((l) => (
        <g key={l}><line x1={x(l)} x2={x(l)} y1={PT} y2={VH - PB} stroke="rgba(255,255,255,0.04)" /><text x={x(l)} y={VH - PB + 16} fill="#6f7c9c" fontSize="10" textAnchor="middle">{l}</text></g>
      ))}
      <text x={(VW + PL) / 2} y={VH - 6} fill="#8b97b5" fontSize="11" textAnchor="middle">Wavelength (nm)</text>
      <text x={14} y={(VH) / 2} fill="#8b97b5" fontSize="11" textAnchor="middle" transform={`rotate(-90 14 ${VH / 2})`}>Unitless (0–1)</text>

      {layers.absorbers && ABSORBERS.filter((a) => a.depth > 0.3).map((a) => (
        <g key={a.id}>
          <rect x={x(a.center - a.width * 1.5)} y={PT} width={x(a.center + a.width * 1.5) - x(a.center - a.width * 1.5)} height={VH - PT - PB} fill="rgba(255,138,107,0.06)" />
          <text x={x(a.center)} y={PT + 12} fill="#ff8a6b" fillOpacity="0.8" fontSize="9" textAnchor="middle">{a.label}</text>
        </g>
      ))}
      {layers.sensitivity && <><path d={sArea} fill="url(#sensg)" /><path d={sPath} stroke="#9d7bff" strokeWidth="1.5" fill="none" /></>}
      {layers.transmittance && <path d={tPath} stroke="#3fd6f0" strokeWidth="1.8" fill="none" />}
      {layers.surfaces.map((s) => (
        <path key={s} d={GRID.map((l, i) => `${i ? 'L' : 'M'}${x(l).toFixed(1)} ${y(Math.min(1, SURFACES[s](l))).toFixed(1)}`).join('')} stroke={SURFACE_COLORS[s]} strokeWidth="1.4" strokeOpacity="0.85" fill="none" strokeDasharray={s === ctx.surfaceB ? '5 3' : undefined} />
      ))}

      {compareBands?.map((l, i) => (
        <line key={`c${i}`} x1={x(l)} x2={x(l)} y1={VH - PB} y2={VH - PB - 14} stroke="#f5c451" strokeWidth="3" />
      ))}
      {bands.map((l, i) => (
        <g key={i}>
          <rect x={x(l - 10)} y={PT} width={x(l + 10) - x(l - 10)} height={VH - PT - PB} fill={i === active ? 'rgba(232,238,252,0.16)' : 'rgba(232,238,252,0.07)'} stroke={i === active ? '#e8eefc' : 'rgba(232,238,252,0.3)'} />
          <text x={x(l)} y={VH - PB - 4} fill="#e8eefc" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">B{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}
