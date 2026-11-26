import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { PageHeader, Loading, Notice, StatusBadge, Reveal } from '../components/ui';
import { useData } from '../hooks/useData';
import type { ExperimentsData, ResultTable } from '../types/data';

const PALETTE = ['#3fd6f0', '#f5c451', '#9aa6c4', '#9d7bff', '#34e3a4'];
const tooltipStyle = { background: '#070d1f', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 };

function ResultChart({ t }: { t: ResultTable }) {
  if (!t.chart) return null;
  const label = (k: string) => t.columns.find((c) => c.key === k)?.label ?? k;
  return (
    <div className="h-[260px]" role="img" aria-label={`Bar chart: ${t.title}. Values are listed in the adjacent table.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={t.rows} margin={{ top: 22, right: 8, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey={t.chart.x} tick={{ fill: '#8b97b5', fontSize: 11 }} interval={0} />
          <YAxis tick={{ fill: '#8b97b5', fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {t.chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {t.chart.series.map((s, i) => (
            <Bar key={s} dataKey={s} name={label(s)} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey={s} position="top" fill="#cbd5e1" fontSize={10} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ t }: { t: ResultTable }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <caption className="sr-only">{t.title}</caption>
        <thead><tr>{t.columns.map((c) => <th key={c.key} className={c.numeric ? 'num' : ''} scope="col">{c.label}{c.numeric && t.unit ? ` (${t.unit})` : ''}</th>)}</tr></thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i}>{t.columns.map((c) => <td key={c.key} className={c.numeric ? 'num' : ''}>{c.numeric && typeof r[c.key] === 'number' ? (r[c.key] as number).toFixed(t.unit === '%' ? 2 : 3) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Results() {
  const { data, error } = useData<ExperimentsData>('experiments.json');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader eyebrow="Experimental research dashboard" title="Preliminary computational results">
        <p>Results from AURORA's synthetic computational experiments on measurement selection, presented with their methodological notes and limitations. They show condition-dependent behaviour, including cases where adaptive selection performed worse than fixed or random baselines.</p>
      </PageHeader>
      <section className="section space-y-6">
        <Notice kind="caution" title="Read before interpreting">
          <ul className="list-disc space-y-1 pl-5">{data.globalCaveats.map((c) => <li key={c}>{c}</li>)}</ul>
        </Notice>
        <div className="panel panel-pad">
          <h2 className="eyebrow">Metric definitions</h2>
          <dl className="mt-3 grid gap-4 md:grid-cols-2">
            {data.metricDefinitions.map((m) => (
              <div key={m.id}>
                <dt className="font-medium text-slate-100">{m.name}</dt>
                <dd className="mt-1 text-sm text-slate-400">{m.definition} {m.higherIsBetter === null ? 'Direction (whether higher is better) to be confirmed.' : m.higherIsBetter ? 'Higher is better.' : 'Lower is better.'}</dd>
                {!m.definitionConfirmed && <dd className="mt-1"><StatusBadge status="requires-validation" /></dd>}
              </div>
            ))}
          </dl>
        </div>
        <nav aria-label="Experiments" className="flex flex-wrap gap-2">
          {data.experiments.map((e) => <button type="button" key={e.id} onClick={() => { const el = document.getElementById(`exp-${e.id}`); el?.scrollIntoView({ behavior: 'smooth' }); el?.querySelector('h2')?.setAttribute('tabindex', '-1'); (el?.querySelector('h2') as HTMLElement | null)?.focus({ preventScroll: true }); }} className="btn-ghost btn-sm">Experiment {e.id}</button>)}
        </nav>
      </section>

      {data.experiments.map((e) => (
        <section key={e.id} id={`exp-${e.id}`} className="section scroll-mt-20 pt-0" aria-labelledby={`exp-${e.id}-title`}>
          <Reveal>
            <article className="panel panel-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Experiment {e.id}</p>
                  <h2 id={`exp-${e.id}-title`} className="h-display mt-1 text-3xl">{e.title.replace(/^Experiment [^:]+:\s*/, '')}</h2>
                </div>
                <StatusBadge status={e.validationStatus} />
              </div>
              <p className="mt-3 text-slate-300">{e.summary}</p>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                {Object.entries(e.setup).map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-slate-500">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt><dd className="text-slate-200">{String(v)}</dd></div>
                ))}
              </dl>
              {e.tables.map((t, i) => (
                <figure key={t.id} className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-slate-200">{t.title}</h3>
                    <DataTable t={t} />
                  </div>
                  <ResultChart t={t} />
                  <figcaption className="lg:col-span-2">Table {e.id}.{i + 1}. {t.title}. Values as reported in the researcher's preliminary summary; not re-computed by this site. No error bars are shown because uncertainty estimates have not yet been reported.</figcaption>
                </figure>
              ))}
              <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
                <div><h3 className="eyebrow mb-2">Interpretation</h3><p className="text-sm text-slate-300">{e.interpretation}</p></div>
                <div><h3 className="eyebrow mb-2">Methodological notes</h3><ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">{e.methodNotes.map((n) => <li key={n}>{n}</li>)}</ul></div>
                <div><h3 className="eyebrow mb-2">Limitations</h3><ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">{e.limitations.map((n) => <li key={n}>{n}</li>)}</ul></div>
              </div>
              <p className="mt-6 font-mono text-[11px] text-slate-500">
                Provenance: {e.provenance.source} · {e.provenance.dataType} · code published: {e.provenance.codeAvailable ? 'yes' : 'not yet'} · raw data published: {e.provenance.rawDataPublished ? 'yes' : 'not yet'}
              </p>
            </article>
          </Reveal>
        </section>
      ))}
      <section className="section pt-0">
        <p className="text-xs text-slate-500">Data source: <code className="font-mono">public/data/experiments.json</code>. Experiments 015, 015g and 015h may differ in budget and reference access, so this dashboard intentionally does not merge them into one comparative chart.</p>
      </section>
    </>
  );
}
