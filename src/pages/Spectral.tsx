import { useMemo, useState } from 'react';
import { PageHeader, Notice, Figure, Slider, Toggle, SectionTitle } from '../components/ui';
import SpectrumPlot, { type Layers } from '../visualizations/SpectrumPlot';
import Heatmap from '../visualizations/Heatmap';
import { correlationMatrix, greedySelect, scoreSet, syntheticLibrary, OBJECTIVE_LABELS, SURFACE_LABELS, SURFACE_COLORS, type Context, type Objective, type SurfaceId } from '../simulations/spectral';

/** Evenly spaced reference set used only to illustrate what a configuration fixed in advance can miss. */
const EXAMPLE_FIXED = [450, 900, 1350, 1800, 2250];
const SURFACE_IDS = Object.keys(SURFACE_LABELS) as SurfaceId[];

export default function Spectral() {
  const [ctx, setCtx] = useState<Context>({ objective: 'discriminate', surfaceA: 'vegetation', surfaceB: 'soil', aod: 0.15, water: 1 });
  const [bands, setBands] = useState<number[]>([480, 560, 670, 860, 1610]);
  const [active, setActive] = useState(0);
  const [layers, setLayers] = useState<Layers>({ transmittance: true, surfaces: ['vegetation', 'soil'], sensitivity: true, absorbers: true });
  const [showCompare, setShowCompare] = useState(false);

  const lib = useMemo(() => syntheticLibrary(), []);
  const adaptive = useMemo(() => greedySelect(ctx, 5, 40, lib), [ctx, lib]);
  const sorted = [...bands].sort((a, b) => a - b);
  const R = useMemo(() => correlationMatrix(sorted, lib), [sorted.join(','), lib]); // eslint-disable-line react-hooks/exhaustive-deps
  const scores = useMemo(() => {
    const s = [
      { name: 'Your selection', bands: sorted, ...scoreSet(sorted, ctx, lib) },
      { name: 'Example evenly spaced set (fixed in advance)', bands: EXAMPLE_FIXED, ...scoreSet(EXAMPLE_FIXED, ctx, lib) },
      { name: 'Toy greedy selection for this context', bands: adaptive, ...scoreSet(adaptive, ctx, lib) },
    ];
    const max = Math.max(...s.map((r) => r.score));
    return s.map((r) => ({ ...r, rel: r.score / max }));
  }, [sorted.join(','), ctx, lib, adaptive]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBand = (i: number, l: number) => setBands((b) => b.map((v, j) => (j === i ? Math.max(400, Math.min(2500, l)) : v)));
  const upd = (p: Partial<Context>) => setCtx((c) => ({ ...c, ...p }));

  return (
    <>
      <PageHeader eyebrow="Five-band adaptive spectral architecture" title="Which five channels carry the information?">
        <p>AURORA investigates whether a small set of five spectral channels can be selected according to what needs to be retrieved, rather than fixed in advance. The working hypothesis is that the best configuration depends on the physical state, the retrieval objective, environmental conditions, and measurement constraints, so there may be no single best set.</p>
      </PageHeader>
      <section className="section space-y-6">
        <Notice kind="illustrative" title="Every curve on this page is illustrative and synthetic">
          Absorption features sit at well-known wavelengths (O₂-A, H₂O, CO₂), but their depths and widths are stylised. The surface reflectance curves are generic shapes, not measured spectra. The sensitivity and redundancy measures are simple toy criteria. <b>No optimized AURORA wavelengths are shown, and no universal five-band configuration has been validated.</b>
        </Notice>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Figure label="Figure 1" caption={<>Interactive illustrative spectrum. Cyan: atmospheric transmittance for two air masses. Solid and dashed coloured lines: synthetic surface reflectance. Violet shading: normalized toy sensitivity for the selected objective. White bars: your five channels (B1–B5, 20 nm wide). Shaded red zones: strong gas absorption. {showCompare && 'Yellow ticks: toy greedy selection.'} Click the plot to move the active channel.</>}>
            <SpectrumPlot ctx={ctx} bands={bands} active={active} onPlace={(l) => setBand(active, l)} layers={layers} compareBands={showCompare ? adaptive : undefined} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Toggle label="Transmittance" checked={layers.transmittance} onChange={(v) => setLayers((l) => ({ ...l, transmittance: v }))} color="#3fd6f0" />
              <Toggle label="Sensitivity" checked={layers.sensitivity} onChange={(v) => setLayers((l) => ({ ...l, sensitivity: v }))} color="#9d7bff" />
              <Toggle label="Absorption bands" checked={layers.absorbers} onChange={(v) => setLayers((l) => ({ ...l, absorbers: v }))} color="#ff8a6b" />
              <Toggle label="Show toy greedy set" checked={showCompare} onChange={setShowCompare} color="#f5c451" />
              {SURFACE_IDS.map((s) => (
                <Toggle key={s} label={SURFACE_LABELS[s]} color={SURFACE_COLORS[s]} checked={layers.surfaces.includes(s)}
                  onChange={(v) => setLayers((l) => ({ ...l, surfaces: v ? [...l.surfaces, s] : l.surfaces.filter((x) => x !== s) }))} />
              ))}
            </div>
          </Figure>

          <div className="panel panel-pad space-y-5">
            <div>
              <label className="label" htmlFor="obj">Retrieval objective</label>
              <select id="obj" value={ctx.objective} onChange={(e) => upd({ objective: e.target.value as Objective })} className="focus-ring mt-1 w-full rounded-lg border border-white/10 bg-midnight px-3 py-2 text-sm">
                {(Object.keys(OBJECTIVE_LABELS) as Objective[]).map((o) => <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="sa">{ctx.objective === 'discriminate' ? 'Surface A' : 'Background surface'}</label>
                <select id="sa" value={ctx.surfaceA} onChange={(e) => upd({ surfaceA: e.target.value as SurfaceId })} className="focus-ring mt-1 w-full rounded-lg border border-white/10 bg-midnight px-2 py-2 text-sm">
                  {SURFACE_IDS.map((s) => <option key={s} value={s}>{SURFACE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="sb">Surface B</label>
                <select id="sb" disabled={ctx.objective !== 'discriminate'} value={ctx.surfaceB} onChange={(e) => upd({ surfaceB: e.target.value as SurfaceId })} className="focus-ring mt-1 w-full rounded-lg border border-white/10 bg-midnight px-2 py-2 text-sm disabled:opacity-40">
                  {SURFACE_IDS.map((s) => <option key={s} value={s}>{SURFACE_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
            <Slider label="Aerosol optical depth (550 nm)" value={ctx.aod} min={0.02} max={1} step={0.01} onChange={(v) => upd({ aod: v })} format={(v) => v.toFixed(2)} />
            <Slider label="Water vapour (relative)" value={ctx.water} min={0.2} max={2.5} step={0.05} onChange={(v) => upd({ water: v })} format={(v) => `${v.toFixed(2)}×`} />
            <div className="border-t border-white/10 pt-4">
              <p className="label mb-2">Five selectable channels — choose one to adjust</p>
              <div className="mb-3 flex gap-1.5" role="radiogroup" aria-label="Active channel">
                {bands.map((_, i) => (
                  <button key={i} type="button" role="radio" aria-checked={i === active} onClick={() => setActive(i)}
                    className={`focus-ring flex-1 rounded-md border py-1 font-mono text-xs ${i === active ? 'border-aurora-cyan bg-aurora-cyan/15 text-aurora-cyan' : 'border-white/10 text-slate-400'}`}>B{i + 1}</button>
                ))}
              </div>
              <Slider label={`B${active + 1} centre wavelength`} value={bands[active]} min={400} max={2500} step={5} onChange={(v) => setBand(active, v)} format={(v) => `${v} nm`} />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setBands([...EXAMPLE_FIXED])}>Load evenly spaced set</button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setBands([...adaptive])}>Load toy greedy set</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <SectionTitle eyebrow="Fixed versus adaptive selection" title="The same five-channel budget, chosen differently">
          <p>Change the objective or the atmosphere above and watch the toy greedy selection move. An evenly spaced set fixed in advance can land inside absorption bands or on redundant parts of the spectrum. This is a demonstration of the idea, not evidence that adaptive selection outperforms well-designed fixed sets: optimized fixed configurations are strong baselines in AURORA's own experiments.</p>
        </SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Figure label="Table 1" caption="Toy scores for the current context. Sensitivity: sum of normalized toy sensitivity at band centres. Redundancy: mean absolute correlation between bands across a synthetic library of 120 mixed pixels. Score = sensitivity × (1 − 0.5 × redundancy), shown relative to the best set. These criteria are illustrative choices, not AURORA's optimization objective.">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Set</th><th>Bands (nm)</th><th className="num">Redundancy</th><th className="num">Relative score</th></tr></thead>
                <tbody>
                  {scores.map((s) => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td className="font-mono text-xs">{s.bands.join(', ')}</td>
                      <td className="num">{s.redundancy.toFixed(2)}</td>
                      <td className="num">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-aurora-green to-aurora-cyan" style={{ width: `${s.rel * 100}%` }} /></div>
                          {s.rel.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Figure>
          <Figure label="Figure 2" caption="Information redundancy of your selection: Pearson correlation between your five channels across the synthetic pixel library. Values near 1 mean two channels mostly repeat the same information.">
            <Heatmap matrix={R} labels={sorted.map((l) => `${l}`)} title="Correlation matrix between selected channels" />
          </Figure>
        </div>
      </section>

      <section className="section pt-0">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Physical state', 'The informative bands over dense vegetation differ from those over snow or water.'],
            ['Retrieval objective', 'Surface discrimination, aerosol retrieval, and water-vapour retrieval favour different parts of the spectrum.'],
            ['Environmental conditions', 'Heavy aerosol or humid air reduces contrast and changes which bands remain useful.'],
            ['Measurement constraints', 'Detector noise, band width, and the number of channels limit what can be selected.'],
          ].map(([t, d]) => (
            <div key={t} className="panel p-5"><h3 className="font-medium text-slate-100">{t}</h3><p className="mt-2 text-sm text-slate-400">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}
