import { ExternalLink, FileText, Mail, GraduationCap, GitBranch, BookMarked, UserRound } from 'lucide-react';
import { PageHeader, Loading, Notice } from '../components/ui';
import { useData, publicUrl } from '../hooks/useData';
import type { SiteData, SiteLink } from '../types/data';

const ICON = { cv: FileText, github: GitBranch, orcid: UserRound, scholar: GraduationCap, contact: Mail } as Record<string, typeof FileText>;

function LinkItem({ l }: { l: SiteLink }) {
  const Icon = ICON[l.id] ?? BookMarked;
  if (!l.url) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-500">
        <Icon className="h-4 w-4" aria-hidden />{l.label}<span className="ml-auto text-[11px]">not yet added</span>
      </li>
    );
  }
  const href = l.kind === 'file' ? publicUrl(l.url) : l.url;
  return (
    <li>
      <a href={href} target={l.kind === 'file' ? undefined : '_blank'} rel="noopener noreferrer" className="focus-ring flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-aurora-cyan/50">
        <Icon className="h-4 w-4 text-aurora-cyan" aria-hidden />{l.label}<ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-500" aria-hidden />
      </a>
    </li>
  );
}

export default function About() {
  const { data, error } = useData<SiteData>('site.json');
  if (!data) return <Loading error={error} />;
  const r = data.researcher;
  return (
    <>
      <PageHeader eyebrow="About the researcher" title={r.name}>
        <p>{r.role}</p>
      </PageHeader>
      <section className="section grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="panel panel-pad">
            <p className="prose-sci text-base">{r.summary}</p>
            <h2 className="eyebrow mb-3 mt-8">Research background</h2>
            <ul className="flex flex-wrap gap-2">{r.interests.map((i) => <li key={i} className="chip border-white/10 text-slate-300 normal-case tracking-normal">{i}</li>)}</ul>
          </div>
          <Notice title="Independent research initiative">{r.statement}</Notice>
        </div>
        <aside className="panel panel-pad">
          <h2 className="eyebrow mb-4">Profiles and documents</h2>
          <ul className="space-y-2">{r.links.map((l) => <LinkItem key={l.id} l={l} />)}</ul>
          <p className="mt-4 text-[11px] text-slate-500">Configure these in <code className="font-mono">public/data/site.json</code>. Use only public professional contact details.</p>
        </aside>
      </section>
    </>
  );
}
