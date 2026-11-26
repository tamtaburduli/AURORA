import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Pause, Play, RotateCcw, Shuffle } from 'lucide-react';
import { PageHeader, Notice, Slider, Toggle, Figure, SectionTitle } from '../components/ui';
import Tex from '../components/Tex';
import { ACTIONS, STATE_LABELS, STRATEGIES, monteCarlo, runAll, type ModalityId, type SimParams, type Strategy } from '../simulations/adaptiveSensing';
import { useReducedMotion } from '../hooks/useReducedMotion';

const DEFAULTS: SimParams = { seed: 2026, budget: 8, noise: 1, variability: 0.01, drift: 0, threshold: 0.35, modalities: ['optical', 'polarimetric', 'acoustic', 'microwave', 'mechanical'] };
const S_COLOR: Record<Strategy, string> = { fixed: '#f5c451', random: '#9aa6c4', adaptive: '#3fd6f0' };
const S_LABEL: Record<Strategy, string> = { fixed: 'Fixed order', random: 'Random', adaptive: 'Uncertainty-aware adaptive' };
const MOD_COLOR: Record<ModalityId, string> = { optical: '#3fd6f0', polarimetric: '#9d7bff', acoustic: '#34e3a4', microwave: '#4f7dff', mechanical: '#f5c451' };
const MOD_LABEL: Record<ModalityId, string> = { optical: 'Optical', polarimetric: 'Polarimetric', acoustic: 'Acoustic', microwave: 'Microwave', mechanical: 'Mechanical' };

const tooltipStyle = { background: '#070d1f', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 };

export default function Simulator() {
  const [p, setP] = useState<SimParams>(DEFAULTS);
  const [view, setView] = useState<Strategy>('adaptive');
  const [play, setPlay] = useState<number | null>(null); // number of steps revealed; null = all
  const reduced = useReducedMotion();
  const dp = useDeferredValue(p);
  const results = useMemo(() => runAll(dp), [dp]);
  const mc = useMemo(() => monteCarlo(dp, 100), [dp]);
  const upd = (q: Partial<SimParams>) => { setP((x) => ({ ...x, ...q })); setPlay(null); };

  const maxLen = Math.max(...STRATEGIES.map((s) => results[s].history.length));
  useEffect(() => {
    if (play === null || play >= maxLen) return;
    const t = setTimeout(() => setPlay((v) => (v === null ? null : v + 1)), reduced ? 0 : 650);
    return () => clearTimeout(t);
  }, [play, maxLen, reduced]);
  const shown = (s: Strategy) => (play === null ? results[s].history : results[s].history.slice(0, Math.max(1, play)));

  // Chart: uncertainty against cumulative budget spent, one series per strategy.
  const chartData = useMemo(() => {
    const xs = Array.from(new Set(STRATEGIES.flatMap((s) => shown(s).map((h) => h.spent)))).sort((a, b) => a - b);
    return xs.map((x) => {
      const row: Record<string, number | null> = { spent: x };
      for (const s of STRATEGIES) {
        const h = shown(s).filter((r) => r.spent <= x + 1e-9);
        const last = h[h.length - 1];
        const reachable = shown(s).some((r) => r.spent >= x - 1e-9);
        row[`${s}_u`] = reachable && last ? +last.uncertainty.toFixed(4) : null;
        row[`${s}_e`] = reachable && last ? +last.error.toFixed(4) : null;
      }
      return row;
    });
  }, [results, play]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = shown(view);
  const last = cur[cur.length - 1];
  const r = results[view];

  return (
    <>
      <PageHeader eyebrow="Interactive adaptive sensing simulator" title="Fixed, random, and uncertainty-aware sensing">
        <p>Three strategies spend the same measurement budget to estimate a hidden four-component physical state. They observe the same synthetic world, with the same noise draws, for a given random seed. Adjust conditions and see where adaptive selection helps, where it does not, and what uncertainty estimates fail to capture.</p>
      </PageHeader>
      <section className="section space-y-6">
        <Notice kind="illustrative" title="Illustrative demonstration, not experimental results">
          This simulator is a transparent, synthetic linear-Gaussian toy model written for education. It does not reproduce AURORA's computational experiments, and its outputs must not be cited as results. Everything is deterministic given the seed. The full logic is in <code className="font-mono text-xs">src/simulations/adaptiveSensing.ts</code>.
        </Notice>

        <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
          <div className="panel panel-pad space-y-5" aria-label="Simulation controls">
            <Slider label="Measurement budget" value={p.budget} min={2} max={20} step={0.5} onChange={(v) => upd({ budget: v })} format={(v) => `${v} units`} hint="Action costs: optical 1, polarimetric 1.5, mechanical 1.5, microwave 2, acoustic 2" />
            <Slider label="Noise level" value={p.noise} min={0.25} max={3} step={0.05} onChange={(v) => upd({ noise: v })} format={(v) => `${v.toFixed(2)}×`} />
            <Slider label="Environmental variability" value={p.variability} min={0} max={0.1} step={0.002} onChange={(v) => upd({ variability: v })} format={(v) => `q = ${v.toFixed(3)}`} hint="Variance added to every state component between measurements" />
            <Slider label="Sensor drift" value={p.drift} min={0} max={0.1} step={0.002} onChange={(v) => upd({ drift: v })} format={(v) => v.toFixed(3)} hint="Unmodelled bias growing with time; the estimator does not know about it" />
            <Slider label="Uncertainty threshold (adaptive stopping)" value={p.threshold} min={0.05} max={1} step={0.01} onChange={(v) => upd({ threshold: v })} format={(v) => v.toFixed(2)} />
            <div>
              <p className="label mb-2">Available sensing modalities</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MOD_LABEL) as ModalityId[]).map((m) => (
                  <Toggle key={m} label={MOD_LABEL[m]} color={MOD_COLOR[m]} checked={p.modalities.includes(m)}
                    onChange={(v) => upd({ modalities: v ? [...p.modalities, m] : p.modalities.filter((x) => x !== m) })} />
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="seed">Random seed</label>
              <div className="mt-1 flex gap-2">
                <input id="seed" type="number" value={p.seed} onChange={(e) => upd({ seed: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  className="focus-ring w-full rounded-lg border border-white/10 bg-midnight px-3 py-2 font-mono text-sm" />
                <button type="button" className="btn-ghost btn-sm" onClick={() => upd({ seed: Math.floor(Math.random() * 1e6) })} aria-label="New random seed"><Shuffle className="h-3.5 w-3.5" aria-hidden /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <button type="button" className="btn-primary btn-sm" onClick={() => setPlay(play === null || play >= maxLen ? 1 : null)}>
                {play !== null && play < maxLen ? <><Pause className="h-3.5 w-3.5" aria-hidden /> Show all</> : <><Play className="h-3.5 w-3.5" aria-hidden /> Replay step by step</>}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => { setP(DEFAULTS); setPlay(null); }}><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset</button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {STRATEGIES.map((s) => {
                const f = shown(s)[shown(s).length - 1];
                return (
                  <button key={s} type="button" onClick={() => setView(s)} aria-pressed={view === s}
                    className={`panel focus-ring p-4 text-left transition ${view === s ? '!border-white/30' : 'opacity-80 hover:opacity-100'}`}>
                    <p className="flex items-center gap-2 text-sm text-slate-200"><span className="h-2 w-2 rounded-full" style={{ background: S_COLOR[s] }} />{S_LABEL[s]}</p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                      <div><dt className="text-slate-500">uncert.</dt><dd className="text-slate-100">{f.uncertainty.toFixed(3)}</dd></div>
                      <div><dt className="text-slate-500">error</dt><dd className="text-slate-100">{f.error.toFixed(3)}</dd></div>
                      <div><dt className="text-slate-500">spent</dt><dd className="text-slate-100">{f.spent}/{p.budget}</dd></div>
                    </dl>
                  </button>
                );
              })}
            </div>

            <Figure label="Figure 1" caption="Estimated uncertainty (RMS posterior standard deviation, solid) and actual RMS estimation error (dashed) against budget spent, for one seed. With sensor drift the error can stay high while the reported uncertainty keeps falling: the estimator is confidently wrong. The dotted line is the adaptive stopping threshold.">
              <div className="h-[320px]" role="img" aria-label="Line chart of uncertainty and error against budget spent for fixed, random and adaptive strategies">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="spent" type="number" domain={[0, p.budget]} tick={{ fill: '#8b97b5', fontSize: 11 }} label={{ value: 'Budget spent (units)', position: 'insideBottom', offset: -10, fill: '#8b97b5', fontSize: 11 }} />
                    <YAxis domain={[0, 'auto']} tick={{ fill: '#8b97b5', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : String(v))} />
                    <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={p.threshold} stroke="#3fd6f0" strokeDasharray="2 4" />
                    {STRATEGIES.map((s) => <Line key={s} type="stepAfter" dataKey={`${s}_u`} name={`${S_LABEL[s]} · uncertainty`} stroke={S_COLOR[s]} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />)}
                    {STRATEGIES.map((s) => <Line key={`${s}e`} type="stepAfter" dataKey={`${s}_e`} name={`${S_LABEL[s]} · error`} stroke={S_COLOR[s]} strokeDasharray="4 4" strokeWidth={1.2} dot={false} isAnimationActive={false} connectNulls legendType="none" />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Figure>

            <div className="panel panel-pad">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-medium text-slate-100">Measurement history — <span style={{ color: S_COLOR[view] }}>{S_LABEL[view]}</span></h2>
                <p className="text-xs text-slate-500">Stopped: {r.stoppedReason === 'threshold' ? 'uncertainty threshold reached' : r.stoppedReason === 'budget' ? 'budget exhausted' : r.stoppedReason === 'no-actions' ? 'no modalities enabled' : 'step limit'}</p>
              </div>
              <div className="mt-4">
                <p className="label">Remaining budget</p>
                <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: `${(last.remaining / p.budget) * 100}%`, background: S_COLOR[view] }} /></div>
                <p className="mt-1 font-mono text-xs text-slate-400">{last.remaining.toFixed(1)} of {p.budget} units · information recovered {(last.recovery * 100).toFixed(1)}% of prior variance · {last.infoBits.toFixed(2)} bits</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Selected measurements">
                {cur.slice(1).map((h) => {
                  const a = ACTIONS.find((x) => x.id === h.actionId)!;
                  return <span key={h.step} className="chip border-white/10" style={{ color: MOD_COLOR[a.modality] }}>{h.step}. {a.label}</span>;
                })}
              </div>
              <div className="mt-4 max-h-72 overflow-auto">
                <table className="tbl">
                  <thead className="sticky top-0 bg-midnight"><tr><th>#</th><th>Measurement</th><th className="num">Cost</th><th className="num">Spent</th><th className="num">EIG (nats)</th><th className="num">Uncertainty</th><th className="num">Error</th><th className="num">Recovery</th></tr></thead>
                  <tbody>
                    {cur.map((h) => (
                      <tr key={h.step}><td className="font-mono text-xs">{h.step}</td><td>{h.actionLabel}</td><td className="num">{h.cost}</td><td className="num">{h.spent}</td><td className="num">{h.eig.toFixed(3)}</td><td className="num">{h.uncertainty.toFixed(3)}</td><td className="num">{h.error.toFixed(3)}</td><td className="num">{(h.recovery * 100).toFixed(1)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <SectionTitle eyebrow="Comparison between strategies" title="Across 100 seeds, not just one">
          <p>A single run can mislead. The table repeats the same settings over seeds {p.seed} to {p.seed + 99}. Fixed and random strategies are real competitors here: depending on budget, noise, and available modalities, a fixed order can match or beat the greedy adaptive strategy, and drift degrades every strategy because none of them models it.</p>
        </SectionTitle>
        <Figure label="Table 1" caption="Monte Carlo summary of the toy model (means over 100 seeds). Lower uncertainty and error are better. These are properties of the toy model only.">
          <div className="overflow-x-auto"><table className="tbl">
            <thead><tr><th>Strategy</th><th className="num">Mean final uncertainty</th><th className="num">Mean final error</th><th className="num">Mean recovery</th><th className="num">Mean budget used</th></tr></thead>
            <tbody>
              {mc.map((m) => (
                <tr key={m.strategy}><td><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: S_COLOR[m.strategy] }} />{S_LABEL[m.strategy]}</td><td className="num">{m.meanUncertainty.toFixed(3)}</td><td className="num">{m.meanError.toFixed(3)}</td><td className="num">{(m.meanRecovery * 100).toFixed(1)}%</td><td className="num">{m.meanSpent.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table></div>
        </Figure>
      </section>

      <section className="section pt-0">
        <details className="panel panel-pad group">
          <summary className="focus-ring cursor-pointer rounded text-lg font-medium text-slate-100">How the simulation works (fully reproducible)</summary>
          <div className="prose-sci mt-5 space-y-4 text-sm">
            <p>The hidden state <Tex>{'x\\in\\mathbb{R}^4'}</Tex> has components: {STATE_LABELS.join(', ')}. It starts from <Tex>{'x_0\\sim\\mathcal N(0,I)'}</Tex> and changes between measurements by <Tex>{'x_{t+1}=x_t+w_t,\\; w_t\\sim\\mathcal N(0,qI)'}</Tex>.</p>
            <p>Each action <Tex>{'a'}</Tex> measures <Tex>{'y=h_a^\\top x+b_a(t)+\\varepsilon,\\;\\varepsilon\\sim\\mathcal N(0,\\sigma_a^2)'}</Tex>, where <Tex>{'b_a(t)=\\delta\\, s_a\\, t'}</Tex> is unmodelled drift. A Kalman filter updates the estimate and covariance <Tex>{'P'}</Tex>.</p>
            <p>The adaptive strategy picks <Tex>{'\\arg\\max_a \\tfrac{1}{c_a}\\cdot\\tfrac12\\ln\\!\\left(1+h_a^\\top P h_a/\\sigma_a^2\\right)'}</Tex> and stops when <Tex>{'\\sqrt{\\operatorname{tr}P/4}\\le\\text{threshold}'}</Tex>. The fixed strategy cycles through available actions in a predetermined order; the random strategy draws uniformly from affordable actions using a separate seeded stream.</p>
            <div className="overflow-x-auto"><table className="tbl">
              <thead><tr><th>Action</th><th>Sensitivity h</th><th className="num">σ</th><th className="num">Cost</th></tr></thead>
              <tbody>{ACTIONS.map((a) => <tr key={a.id}><td>{a.label}</td><td className="font-mono text-xs">[{a.h.join(', ')}]</td><td className="num">{a.sigma}</td><td className="num">{a.cost}</td></tr>)}</tbody>
            </table></div>
            <p>All sensitivities, noise levels and costs are invented for illustration. The pseudo-random generator is Mulberry32, so any seed reproduces identically in every browser.</p>
          </div>
        </details>
      </section>
    </>
  );
}
