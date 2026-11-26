import { FileText, ExternalLink } from 'lucide-react';
import { PageHeader, Loading, StatusBadge } from '../components/ui';
import { useData, useFileExists, publicUrl } from '../hooks/useData';
import type { ManuscriptData } from '../types/data';

function FileButton({ f }: { f: ManuscriptData['files'][number] }) {
  const exists = useFileExists(f.path ?? null);
  if (f.url) return <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"><ExternalLink className="h-4 w-4" aria-hidden />{f.label}</a>;
  if (f.path && exists) return <a href={publicUrl(f.path)} download className="btn-primary"><FileText className="h-4 w-4" aria-hidden />{f.label}</a>;
  return null; // hidden until the file exists
}

export default function Manuscript() {
  const { data, error } = useData<ManuscriptData>('manuscript.json');
  if (!data) return <Loading error={error} />;
  const pending = data.files.filter((f) => !f.url && !f.path);
  return (
    <>
      <PageHeader eyebrow="Manuscript and publications" title="Manuscript">
        <p>The AURORA manuscript is being prepared. Sections will be filled in as the work is verified.</p>
      </PageHeader>
      <section className="section">
        <article className="panel panel-pad md:p-12">
          <StatusBadge status="in-progress" />
          <h2 className="h-display mt-5 text-3xl md:text-5xl">{data.title}</h2>
          <p className="mt-3 font-display text-xl italic text-slate-300 md:text-2xl">{data.subtitle}</p>
          <p className="mt-4 text-sm text-slate-400">{data.authors.join(', ')}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">Status</dt><dd className="text-slate-200">{data.status}</dd></div>
            <div><dt className="text-xs text-slate-500">Peer review</dt><dd className="text-slate-200">{data.peerReviewStatus ?? 'Not submitted'}</dd></div>
            {data.venue && <div><dt className="text-xs text-slate-500">Venue</dt><dd className="text-slate-200">{data.venue}</dd></div>}
            {data.doi && <div><dt className="text-xs text-slate-500">DOI</dt><dd className="text-slate-200">{data.doi}</dd></div>}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">{data.files.map((f) => <FileButton key={f.id} f={f} />)}</div>
          {pending.length > 0 && <p className="mt-3 text-xs text-slate-500">Not yet available: {pending.map((f) => f.label.toLowerCase()).join(', ')}.</p>}
        </article>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data.sections.map((s) => (
            <section key={s.id} className="panel p-6" aria-labelledby={`ms-${s.id}`}>
              <h3 id={`ms-${s.id}`} className="font-medium text-slate-100">{s.title}</h3>
              {s.content ? (
                <div className="prose-sci mt-3 text-sm">{s.content.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>
              ) : s.draftBullets ? (
                <>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">{s.draftBullets.map((b) => <li key={b}>{b}</li>)}</ul>
                  <p className="mt-3 text-[11px] text-slate-500">Draft working hypotheses; wording to be finalized.</p>
                </>
              ) : (
                <p className="mt-3 text-sm italic text-slate-500">In preparation.</p>
              )}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
