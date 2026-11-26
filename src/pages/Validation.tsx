import { CheckCircle2, CircleDashed } from 'lucide-react';
import { PageHeader, Loading, Notice, SectionTitle, Reveal } from '../components/ui';
import { useData } from '../hooks/useData';
import type { ReferencesData } from '../types/data';

interface ValidationData {
  objective: string; noveltyStatement: string;
  existing: { id: string; title: string; text: string; refs: string[] }[];
  contribution: string[]; contributionCaveat: string;
  baselines: { name: string; why: string }[];
  negativeResults: string[]; failureCases: string[];
  ablations: { name: string; done: boolean }[];
  reproducibility: { item: string; done: boolean }[];
  independentValidation: string;
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-completed" aria-label="done" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-label="not yet done" />}
      <span className={done ? 'text-slate-200' : 'text-slate-400'}>{children}</span>
    </li>
  );
}

export default function Validation() {
  const { data, error } = useData<ValidationData>('validation.json');
  const { data: refs } = useData<ReferencesData>('references.json');
  if (!data) return <Loading error={error} />;
  const ref = (id: string) => refs?.references.find((r) => r.id === id);
  const cited = Array.from(new Set(data.existing.flatMap((e) => e.refs))).map(ref).filter(Boolean);

  return (
    <>
      <PageHeader eyebrow="Scientific novelty and validation" title="Scientific Novelty and Validation">
        <p>{data.objective}</p>
      </PageHeader>
      <section className="section space-y-10">
        <Notice kind="caution" title="Novelty is a hypothesis, not a claim">{data.noveltyStatement}</Notice>

        <div>
          <SectionTitle eyebrow="Context" title="Established approaches" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.existing.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.03}>
                <article className="panel h-full p-5">
                  <h3 className="font-medium text-slate-100">{e.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{e.text}</p>
                  {e.refs.length > 0 && <p className="mt-3 font-mono text-[11px] text-slate-500">{e.refs.map((r) => { const x = ref(r); return x ? `${x.authors.split(',')[0].split(' and ')[0]} (${x.year})` : r; }).join('; ')}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">AURORA's proposed research contribution</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">{data.contribution.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="mt-4 text-xs text-slate-500">{data.contributionCaveat}</p>
          </div>
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">Baseline comparisons</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {data.baselines.map((b) => <div key={b.name}><dt className="font-medium text-slate-100">{b.name}</dt><dd className="text-slate-400">{b.why}</dd></div>)}
            </dl>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel panel-pad border-status-validation/20">
            <h2 className="h-display text-2xl">Negative results</h2>
            <p className="mt-2 text-sm text-slate-400">Reported deliberately. Preliminary values; see the results dashboard for caveats.</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">{data.negativeResults.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">Failure cases</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">{data.failureCases.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">Ablation studies</h2>
            <ul className="mt-4 space-y-2">{data.ablations.map((a) => <Check key={a.name} done={a.done}>{a.name}</Check>)}</ul>
          </div>
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">Reproducibility</h2>
            <ul className="mt-4 space-y-2">{data.reproducibility.map((a) => <Check key={a.item} done={a.done}>{a.item}</Check>)}</ul>
          </div>
          <div className="panel panel-pad">
            <h2 className="h-display text-2xl">Independent experimental validation</h2>
            <p className="mt-4 text-sm text-slate-300">{data.independentValidation}</p>
          </div>
        </div>

        {cited.length > 0 && (
          <div>
            <h2 className="eyebrow mb-3">Background references</h2>
            <ol className="space-y-1.5 text-sm text-slate-400">
              {cited.map((r) => r && <li key={r.id}>{r.authors} ({r.year}). <i>{r.title}</i>. {r.venue}.</li>)}
            </ol>
            <p className="mt-2 text-xs text-slate-500">Cited for context only. None of these authors is affiliated with AURORA. Verify bibliographic details before citing.</p>
          </div>
        )}
      </section>
    </>
  );
}
