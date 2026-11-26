import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader, Reveal, Loading, Figure, SectionTitle } from '../components/ui';
import { useData } from '../hooks/useData';
import AmbiguityMini from '../visualizations/AmbiguityMini';

interface ResearchData { intro: string; problems: { id: string; title: string; text: string }[]; approach: string[] }

export default function Research() {
  const { data, error } = useData<ResearchData>('research.json');
  if (!data) return <Loading error={error} />;
  return (
    <>
      <PageHeader eyebrow="Research overview" title="Why fixed observations are not always enough">
        <p>{data.intro}</p>
      </PageHeader>
      <section className="section">
        <SectionTitle eyebrow="Motivating problems" title="Eight scientific problems" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.problems.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.03}>
              <article className="panel h-full p-5">
                <p className="font-mono text-xs text-aurora-cyan/70">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-2 font-medium text-slate-100">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section pt-0">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="The AURORA question" title="Determine what is missing, then choose what to measure" />
            <ol className="space-y-3">
              {data.approach.map((a, i) => (
                <li key={i} className="flex gap-3 text-slate-300">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-aurora-cyan/40 font-mono text-xs text-aurora-cyan">{i + 1}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/architecture" className="btn-ghost">See the architecture <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link to="/radiative-transfer" className="btn-ghost">Explore the inverse problem</Link>
            </div>
          </div>
          <Figure label="Figure 1" caption={<>Illustrative surface–atmosphere ambiguity from a toy analytic model (not libRadtran output). Each curve is the set of (aerosol optical depth, surface albedo) pairs consistent with one simulated observation at one wavelength. One wavelength leaves a whole curve of solutions; adding a second wavelength narrows the solution to the region where the curves cross.</>}>
            <AmbiguityMini />
          </Figure>
        </div>
      </section>
    </>
  );
}
