import { useState, type KeyboardEvent } from 'react';
import { Telescope, Orbit, AudioLines, Radar, Vibrate, type LucideIcon } from 'lucide-react';
import { PageHeader, Loading, Notice, StatusBadge } from '../components/ui';
import { DEMOS } from '../visualizations/ModalityDemos';
import { useData } from '../hooks/useData';
import type { ModalitiesData } from '../types/data';

const ICONS: Record<string, LucideIcon> = { Telescope, Orbit, AudioLines, Radar, Vibrate };

export default function Multimodal() {
  const { data, error } = useData<ModalitiesData>('modalities.json');
  const [idx, setIdx] = useState(0);
  if (!data) return <Loading error={error} />;
  const m = data.modalities[idx];
  const Demo = DEMOS[m.demo];
  const Icon = ICONS[m.icon] ?? Telescope;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => (i + 1) % data.modalities.length); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => (i - 1 + data.modalities.length) % data.modalities.length); }
  };
  return (
    <>
      <PageHeader eyebrow="Multimodal sensing" title="Complementary physical evidence">
        <p>A single type of observation can leave a physical question unresolved. AURORA studies whether observables governed by different physics—light, polarization, sound, microwaves, and mechanical response—can supply the missing information.</p>
      </PageHeader>
      <section className="section">
        <Notice kind="caution" title="Not an integrated instrument">{data.integrationNotice}</Notice>
        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div role="tablist" aria-label="Sensing modalities" aria-orientation="vertical" className="flex gap-2 overflow-x-auto lg:flex-col" onKeyDown={onKey}>
            {data.modalities.map((mod, i) => {
              const I = ICONS[mod.icon] ?? Telescope;
              return (
                <button key={mod.id} id={`tab-${mod.id}`} role="tab" type="button" aria-selected={i === idx} aria-controls={`panel-${mod.id}`} tabIndex={i === idx ? 0 : -1} onClick={() => setIdx(i)}
                  className={`focus-ring flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${i === idx ? 'border-white/25 bg-white/[0.07] text-slate-50' : 'border-white/5 text-slate-400 hover:text-slate-200'}`}>
                  <I className="h-4 w-4" style={{ color: mod.color }} aria-hidden />{mod.name}
                </button>
              );
            })}
          </div>
          <div id={`panel-${m.id}`} role="tabpanel" aria-labelledby={`tab-${m.id}`} className="panel panel-pad">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="h-display flex items-center gap-3 text-3xl"><Icon className="h-6 w-6" style={{ color: m.color }} aria-hidden />{m.name}</h2>
              <StatusBadge status={m.experimentalStatus} />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {m.observables.map((o) => <li key={o} className="chip border-white/10 text-slate-300">{o}</li>)}
            </ul>
            <div className="mt-6 grid gap-8 xl:grid-cols-2">
              <div className="space-y-5 text-sm leading-relaxed">
                <div><h3 className="eyebrow mb-1">Physical principles</h3><p className="text-slate-300">{m.principles}</p></div>
                <div><h3 className="eyebrow mb-1">Proposed contribution to AURORA</h3><p className="text-slate-300">{m.contribution}</p></div>
                <div><h3 className="eyebrow mb-1">Experimental status</h3><p className="text-slate-300">{m.statusDetail}</p></div>
                <div><h3 className="eyebrow mb-1">Limitations</h3><ul className="list-disc space-y-1 pl-5 text-slate-400">{m.limitations.map((l) => <li key={l}>{l}</li>)}</ul></div>
              </div>
              <figure>
                <div className="rounded-xl border border-white/5 bg-void/40 p-4">{Demo && <Demo />}</div>
                <figcaption>Interactive illustration of the physical principle (synthetic, simplified). It does not show AURORA data.</figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
