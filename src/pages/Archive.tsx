import { PageHeader, Loading, Notice, StatusBadge, Reveal } from '../components/ui';
import { useData } from '../hooks/useData';
import type { ArchiveData } from '../types/data';

export default function Archive() {
  const { data, error } = useData<ArchiveData>('archive.json');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader eyebrow="Exploratory research archive" title="Ideas at the edge of the program">
        <p>A record of speculative directions considered during AURORA's development. They are kept here, separate from the primary research program, so that curiosity is documented without being mistaken for evidence.</p>
      </PageHeader>
      <section className="section">
        <Notice kind="caution" title="Exploratory hypotheses only">{data.notice}</Notice>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {data.entries.map((e, i) => (
            <Reveal key={e.id} delay={i * 0.03}>
              <article className="panel h-full p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="h-display text-2xl">{e.title}</h2>
                  <StatusBadge status={e.status} />
                </div>
                <dl className="mt-4 space-y-4 text-sm">
                  <div><dt className="eyebrow mb-1 !text-status-completed/80">Established physics (independent of AURORA)</dt><dd className="text-slate-300">{e.established}</dd></div>
                  <div><dt className="eyebrow mb-1 !text-status-validation/90">Speculative AURORA hypothesis</dt><dd className="text-slate-300">{e.hypothesis}</dd></div>
                  <div><dt className="eyebrow mb-1">Open questions</dt><dd><ul className="list-disc space-y-1 pl-5 text-slate-400">{e.openQuestions.map((q) => <li key={q}>{q}</li>)}</ul></dd></div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
