import { useEffect, useMemo, useState } from 'react';
import { PageHeader, Loading, Notice, Figure, Slider, Toggle, SectionTitle } from '../components/ui';
import Tex from '../components/Tex';
import { AmbiguityChart, WL_COLORS } from '../visualizations/AmbiguityMini';
import { useData, publicUrl } from '../hooks/useData';
import type { RTData } from '../types/data';

interface LutRow { aod: number; albedo: number; sza: number; umu: number; wavelength: number; value: number }

export default function RadiativeTransfer() {
  const { data, error } = useData<RTData>('radiative-transfer.json');
  const [selState, setSel] = useState<Record<string, number>>({});
  const [lut, setLut] = useState<LutRow[] | null>(null);
  const [truth, setTruth] = useState({ tau: 0.35, albedo: 0.2, sza: 25, mu: 0.95 });
  const [wls, setWls] = useState<number[]>([450, 850]);

  useEffect(() => {
    if (!data) return;
    if (data.lutFile) fetch(publicUrl(data.lutFile)).then((r) => (r.ok ? r.json() : null)).then(setLut).catch(() => setLut(null));
  }, [data]);

  const product = data ? data.parameters.reduce((n, p) => n * p.values.length, 1) : 0;

  // Row = (aod, albedo, sza, umu) combination; column = wavelength.
  const rows = useMemo(() => {
    if (!data) return [];
    const [aod, alb, sza, umu] = ['aod', 'albedo', 'sza', 'umu'].map((id) => data.parameters.find((p) => p.id === id)!.values);
    const out: { aod: number; albedo: number; sza: number; umu: number }[] = [];
    for (const a of aod) for (const b of alb) for (const s of sza) for (const u of umu) out.push({ aod: a, albedo: b, sza: s, umu: u });
    return out;
  }, [data]);
  if (!data) return <Loading error={error} />;
  const sel: Record<string, number> = { ...Object.fromEntries(data.parameters.map((p) => [p.id, p.values[0]])), ...selState };
  const wl = data.parameters.find((p) => p.id === 'wavelength')!.values;
  const selRow = rows.findIndex((r) => r.aod === sel.aod && r.albedo === sel.albedo && r.sza === sel.sza && r.umu === sel.umu);
  const selCol = wl.indexOf(sel.wavelength);
  const configIndex = selRow * wl.length + selCol;
  const lutVal = (r: typeof rows[number], l: number) => lut?.find((x) => x.aod === r.aod && x.albedo === r.albedo && x.sza === r.sza && x.umu === r.umu && x.wavelength === l)?.value;
  const lutMax = lut ? Math.max(...lut.map((x) => x.value)) : 1;

  const input = `# Example uvspec input TEMPLATE for one LUT configuration (#${configIndex + 1} of ${product}).
# Generated from the parameter design; verify against the actual experiment scripts.
# This is an input file, not simulation output.
atmosphere_file   <atmosphere profile used in the experiments>
source            solar <solar spectrum file>
wavelength        ${sel.wavelength} ${sel.wavelength}
rte_solver        disort
number_of_streams ${data.solver.streams}
sza               ${sel.sza}
umu               ${sel.umu}
albedo            ${sel.albedo.toFixed(2)}
aerosol_default
aerosol_set_tau_at_wvl 550 ${sel.aod}
quiet`;

  return (
    <>
      <PageHeader eyebrow="Radiative transfer research" title="Modelling what reaches the sensor">
        <p>To decide which observation is informative, AURORA needs a physical forward model: how surface reflectance, aerosols, gases, and geometry combine to produce the radiance a sensor records. This work uses the libRadtran framework with the DISORT discrete-ordinates solver.</p>
      </PageHeader>
      <section className="section space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          {data.environment.map((e) => (
            <div key={e.name} className="panel p-5">
              <p className="font-mono text-xs text-aurora-cyan">{e.version ?? 'version to be added'}</p>
              <h2 className="mt-1 text-lg font-medium text-slate-100">{e.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{e.role}</p>
            </div>
          ))}
        </div>

        <SectionTitle eyebrow="Lookup-table parameter space" title={`${product} configurations`}>
          <p>The lookup table spans every combination of the parameters below: {data.parameters.map((p) => `${p.values.length} ${p.label.toLowerCase()}${p.values.length > 1 ? ' values' : ''}`).join(' × ')} = <b>{product}</b> configurations{product === data.expectedConfigurations ? '' : ` (expected ${data.expectedConfigurations} — check the parameter file)`}, solved with {data.solver.streams} DISORT streams.</p>
        </SectionTitle>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="panel panel-pad space-y-5">
            {data.parameters.map((p) => (
              <fieldset key={p.id}>
                <legend className="label mb-2"><Tex>{p.symbol}</Tex> {p.label}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {p.values.map((v) => (
                    <button key={v} type="button" aria-pressed={sel[p.id] === v} onClick={() => setSel((s) => ({ ...s, [p.id]: v }))}
                      className={`focus-ring rounded-md border px-2.5 py-1 font-mono text-xs ${sel[p.id] === v ? 'border-aurora-cyan bg-aurora-cyan/15 text-aurora-cyan' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                      {v}{p.unit && p.unit !== '' ? ` ${p.unit}` : ''}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="font-mono text-xs text-slate-400">Selected configuration: #{configIndex + 1} / {product}</p>
          </div>

          <Figure label="Figure 1" caption={<>Map of the {product}-configuration parameter space. Each column is a wavelength; each row is one combination of aerosol optical depth, surface albedo, solar zenith angle, and viewing zenith cosine. Click a cell to select it. {lut ? 'Cell brightness shows published libRadtran output.' : 'No libRadtran output has been published to this site yet, so cells are not colour-coded by value.'}</>}>
            <div className="overflow-x-auto">
              <div className="inline-grid min-w-full gap-px" style={{ gridTemplateColumns: `176px repeat(${wl.length}, minmax(44px, 1fr))` }} role="grid" aria-label="Lookup table configurations">
                <div className="text-[10px] text-slate-500" role="columnheader">τ · ρ · θ₀ · μ</div>
                {wl.map((l) => <div key={l} role="columnheader" className="pb-1 text-center font-mono text-[10px]" style={{ color: WL_COLORS[l] }}>{l}</div>)}
                {rows.map((r, i) => (
                  <div key={i} role="row" className="contents">
                    <div role="rowheader" className={`whitespace-nowrap pr-2 font-mono text-[10px] leading-4 ${i === selRow ? 'text-aurora-cyan' : 'text-slate-500'}`}>{r.aod} · {r.albedo.toFixed(2)} · {r.sza}° · {r.umu}</div>
                    {wl.map((l, j) => {
                      const v = lutVal(r, l);
                      const on = i === selRow && j === selCol;
                      return (
                        <button key={l} type="button" role="gridcell" aria-selected={on} aria-label={`Configuration ${i * wl.length + j + 1}: AOD ${r.aod}, albedo ${r.albedo}, SZA ${r.sza}, mu ${r.umu}, ${l} nm`}
                          onClick={() => setSel({ aod: r.aod, albedo: r.albedo, sza: r.sza, umu: r.umu, wavelength: l })}
                          className={`h-4 rounded-[3px] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-cyan ${on ? 'ring-1 ring-white' : ''}`}
                          style={{ background: v !== undefined ? `rgba(63,214,240,${0.1 + 0.9 * (v / lutMax)})` : on ? '#3fd6f0' : i === selRow || j === selCol ? 'rgba(63,214,240,0.22)' : 'rgba(255,255,255,0.05)' }} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Figure>
        </div>

        <Figure label="Listing 1" caption="Example libRadtran (uvspec) input template generated from the selected parameter values. Placeholders in angle brackets must be replaced with the files used in the actual experiments; the keyword set should be checked against the libRadtran 2.0.6 manual. This is an input file, not output.">
          <pre className="overflow-x-auto rounded-lg bg-void/70 p-4 font-mono text-xs leading-relaxed text-slate-300"><code>{input}</code></pre>
        </Figure>
      </section>

      <section className="section pt-0">
        <SectionTitle eyebrow="The surface–atmosphere inverse problem" title="Many states, one observation">
          <p>A satellite or ground sensor measures top-of-atmosphere reflectance <Tex>{'R_{\\mathrm{TOA}}(\\lambda)'}</Tex>. In a common simplified form,</p>
          <Tex display>{'R_{\\mathrm{TOA}}(\\lambda)=R_{\\mathrm{path}}(\\lambda;\\tau)+\\frac{T^{\\downarrow}(\\lambda;\\tau)\\,T^{\\uparrow}(\\lambda;\\tau)\\,\\rho_s(\\lambda)}{1-S(\\lambda;\\tau)\\,\\rho_s(\\lambda)}'}</Tex>
          <p>Increasing aerosol optical depth <Tex>{'\\tau'}</Tex> adds path reflectance but attenuates the surface signal; increasing surface albedo <Tex>{'\\rho_s'}</Tex> adds surface signal. At a single wavelength these effects can trade off exactly, so a continuum of <Tex>{'(\\tau,\\rho_s)'}</Tex> pairs explains the same measurement. Additional wavelengths, viewing geometries, polarization, or other observables can break the degeneracy, but only if they respond differently to the two unknowns.</p>
        </SectionTitle>
        <Notice kind="illustrative" title="Toy analytic model — not libRadtran output">
          The interactive figure below uses a crude single-layer approximation (Ångström exponent 1.3, fixed single-scattering albedo and phase function) defined in <code className="font-mono text-xs">src/simulations/toyRadiative.ts</code>. It shows the shape of the problem only and has no quantitative validity.
        </Notice>
        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="panel panel-pad space-y-5">
            <Slider label="True aerosol optical depth (550 nm)" value={truth.tau} min={0.05} max={0.65} step={0.01} onChange={(v) => setTruth((t) => ({ ...t, tau: v }))} format={(v) => v.toFixed(2)} />
            <Slider label="True surface albedo" value={truth.albedo} min={0.05} max={0.4} step={0.01} onChange={(v) => setTruth((t) => ({ ...t, albedo: v }))} format={(v) => v.toFixed(2)} />
            <Slider label="Solar zenith angle" value={truth.sza} min={10} max={70} step={1} onChange={(v) => setTruth((t) => ({ ...t, sza: v }))} format={(v) => `${v}°`} />
            <Slider label="Viewing zenith cosine" value={truth.mu} min={0.5} max={1} step={0.01} onChange={(v) => setTruth((t) => ({ ...t, mu: v }))} format={(v) => v.toFixed(2)} />
            <div>
              <p className="label mb-2">Observed wavelengths</p>
              <div className="flex flex-wrap gap-2">
                {wl.map((l) => <Toggle key={l} label={`${l} nm`} color={WL_COLORS[l]} checked={wls.includes(l)} onChange={(v) => setWls((w) => (v ? [...w, l].sort((a, b) => a - b) : w.filter((x) => x !== l)))} />)}
              </div>
            </div>
            <p className="text-xs text-slate-500">The toy model assumes the same surface albedo at every wavelength, which real surfaces do not have. That simplification is exactly why extra wavelengths help so much here; with spectrally varying surfaces the problem is harder.</p>
          </div>
          <Figure label="Figure 2" caption="Solution curves of the toy inverse problem: for each observed wavelength, the set of (τ₅₅₀, ρ_s) pairs that reproduces the simulated observation exactly. The white circle marks the true state. Curves that cross at a steep angle constrain the state well; nearly parallel curves leave it ambiguous.">
            <AmbiguityChart truth={truth} wavelengths={wls} height={360} />
          </Figure>
        </div>
      </section>
    </>
  );
}
