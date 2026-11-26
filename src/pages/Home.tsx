import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Spline, Gauge, Telescope, AudioLines, Sigma, ScanLine, ChartLine } from 'lucide-react';
import WavefrontCanvas from '../visualizations/WavefrontCanvas';
import { Reveal, SectionTitle } from '../components/ui';
import { useData } from '../hooks/useData';
import type { SiteData } from '../types/data';

const FALLBACK: SiteData['project'] = {
  name: 'AURORA',
  fullName: 'Adaptive Uncertainty-aware Radiative Observation and Ranging Architecture',
  tagline: 'Beyond fixed observations. Toward information-aware sensing.',
  status: 'Active Research and Experimental Development',
  question: 'Can a sensing system recognize when its observations are insufficient, identify missing information, and adapt its measurement configuration to recover that information?',
  mission: 'AURORA investigates whether existing sensing technologies can be improved through uncertainty-aware decision-making, adaptive spectral selection, complementary physical observables, and information-efficient measurement strategies.',
  disclaimer: 'AURORA is an ongoing scientific research project, not a commercially available or fully validated physical sensor.',
};

const CARDS = [
  { to: '/research', icon: ScanLine, title: 'Research Overview', text: 'Incomplete observations, surface–atmosphere ambiguity, drift, and fixed measurement configurations.' },
  { to: '/architecture', icon: Layers, title: 'System Architecture', text: 'A ten-stage loop from observation through uncertainty assessment to adaptive selection.' },
  { to: '/spectral', icon: Spline, title: 'Five-Band Spectral Research', text: 'How the most informative channels may depend on state, objective, and conditions.' },
  { to: '/multimodal', icon: Telescope, title: 'Multimodal Sensing', text: 'Optical, polarimetric, acoustic, microwave, and mechanical observables as complementary evidence.' },
  { to: '/simulator', icon: Gauge, title: 'Adaptive Sensing Simulator', text: 'An illustrative, seeded simulation comparing fixed, random, and uncertainty-aware strategies.' },
  { to: '/results', icon: ChartLine, title: 'Experimental Results', text: 'Preliminary computational results, including the cases where adaptive selection did not help.' },
  { to: '/acoustic-lab', icon: AudioLines, title: 'Acoustic Laboratory', text: 'Analyse recordings locally in your browser: FFT, spectrogram, peaks, transients.' },
  { to: '/mathematics', icon: Sigma, title: 'Mathematical Framework', text: 'Inverse problems, Bayesian estimation, expected information gain, stopping rules.' },
];

export default function Home() {
  const { data } = useData<SiteData>('site.json');
  const p = data?.project ?? FALLBACK;
  return (
    <>
      <section className="relative isolate min-h-[92vh] overflow-hidden" aria-labelledby="hero-title">
        <WavefrontCanvas className="absolute inset-0 -z-10 h-full w-full" />
        <div className="grid-bg absolute inset-0 -z-10 opacity-40" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-void" aria-hidden />
        <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-5 py-24 md:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <p className="chip border-aurora-green/40 bg-aurora-green/10 text-aurora-green">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden /> {p.status}
            </p>
            <h1 id="hero-title" className="mt-6 font-display text-7xl font-medium tracking-[0.14em] text-slate-50 max-[380px]:text-6xl sm:text-8xl sm:tracking-[0.18em] md:text-[9.5rem] md:leading-none">
              <span className="aurora-text">AURORA</span>
            </h1>
            <p className="mt-4 max-w-3xl font-mono text-xs uppercase tracking-[0.2em] text-slate-400 md:text-sm">{p.fullName}</p>
            <p className="mt-8 max-w-2xl font-display text-2xl italic text-slate-100 md:text-3xl">{p.tagline}</p>
            <p className="mt-6 max-w-2xl text-slate-300">{p.mission}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/research" className="btn-primary">Explore the Research <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link to="/architecture" className="btn-ghost">System Architecture</Link>
              <Link to="/results" className="btn-ghost">Experimental Results</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section" aria-labelledby="question">
        <Reveal>
          <div className="panel panel-pad relative overflow-hidden md:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-aurora-violet/10 blur-3xl" aria-hidden />
            <p className="eyebrow">Primary research question</p>
            <h2 id="question" className="h-display mt-4 max-w-4xl text-3xl leading-snug md:text-[2.6rem]">{p.question}</h2>
            <p className="mt-6 max-w-3xl text-sm text-slate-400">{p.disclaimer}</p>
          </div>
        </Reveal>
      </section>

      <section className="section pt-0" aria-labelledby="explore">
        <SectionTitle eyebrow="Explore" title="The research program">
          Each section separates what has been computed, what is illustrative, and what is still a proposal.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <Reveal key={c.to} delay={i * 0.04}>
              <Link to={c.to} className="panel focus-ring group block h-full p-5 transition hover:border-aurora-cyan/40 hover:bg-white/[0.05]">
                <c.icon className="h-5 w-5 text-aurora-cyan" aria-hidden />
                <h3 className="mt-4 font-medium text-slate-100">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{c.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-aurora-cyan opacity-70 transition group-hover:opacity-100">Open <ArrowRight className="h-3 w-3" aria-hidden /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="principles">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <p className="eyebrow">How to read this site</p>
              <h2 id="principles" className="h-display mt-2 text-3xl">Evidence before claims</h2>
            </div>
            <ul className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2 md:col-span-2">
              <li className="panel p-4"><b className="text-slate-100">Preliminary results</b> are copied from the researcher's computational experiments and still require verification of metrics, protocols, and budget comparability.</li>
              <li className="panel p-4"><b className="text-slate-100">Illustrative figures</b> and the simulator use synthetic, documented toy models. They explain ideas; they are not results.</li>
              <li className="panel p-4"><b className="text-slate-100">Negative and mixed results</b> are reported alongside positive ones. Adaptive selection did not outperform baselines in every condition.</li>
              <li className="panel p-4"><b className="text-slate-100">Exploratory ideas</b> are archived separately and are not presented as established mechanisms.</li>
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
}
