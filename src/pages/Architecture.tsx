import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader, Loading, Notice, StatusBadge, Toggle, SectionTitle } from '../components/ui';
import ArchitectureDiagram from '../visualizations/ArchitectureDiagram';
import { useData } from '../hooks/useData';
import type { ArchitectureData } from '../types/data';

export default function Architecture() {
  const { data, error } = useData<ArchitectureData>('architecture.json');
  const [sel, setSel] = useState(5);
  const [showStatus, setShowStatus] = useState(false);
  if (!data) return <Loading error={error} />;
  const node = data.nodes.find((n) => n.id === sel)!;
  return (
    <>
      <PageHeader eyebrow="System architecture" title="An uncertainty-aware sensing loop">
        <p>The proposed AURORA architecture treats measurement as a sequence of decisions. After each observation, the system assesses what remains unresolved and chooses the next observation accordingly, until the retrieval is sufficiently constrained or the budget is spent.</p>
      </PageHeader>
      <section className="section">
        <Notice kind="caution" title="Proposed architecture versus implemented experiments">
          This diagram describes the <b>proposed conceptual architecture</b>. Some stages have been implemented in computational (synthetic) experiments; others remain conceptual. No physical instrument implements this loop. Use “Show implementation status” to see which is which. Status labels are drafts awaiting the researcher's confirmation.
        </Notice>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <figure className="panel panel-pad">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">Select a stage to read its scientific purpose.</p>
              <Toggle label="Show implementation status" checked={showStatus} onChange={setShowStatus} />
            </div>
            <div className="overflow-x-auto"><div className="min-w-[640px]"><ArchitectureDiagram nodes={data.nodes} selected={sel} onSelect={setSel} showStatus={showStatus} /></div></div>
            {showStatus && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-2"><span className="h-3 w-5 rounded border border-[#3fd6f0]" />Implemented in computational experiments</span>
                <span className="flex items-center gap-2"><span className="h-3 w-5 rounded border border-dashed border-[#9aa6c4]" />Conceptual</span>
              </div>
            )}
            <figcaption>Figure 1. Ten-stage adaptive sensing loop. Cyan arrows show the forward sequence; the violet path is the feedback loop from the stopping decision back to uncertainty assessment; the green dashed path marks the physical interaction between acquisition and the environment.</figcaption>
          </figure>
          <AnimatePresence mode="wait">
            <motion.aside key={node.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }} className="panel panel-pad" aria-live="polite">
              <p className="eyebrow">Stage {String(node.id).padStart(2, '0')}</p>
              <h2 className="h-display mt-2 text-2xl">{node.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{node.purpose}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={node.implementation} />
                {!node.implementationConfirmed && <span className="text-[11px] text-slate-500">status to be confirmed</span>}
              </div>
              <div className="mt-6 flex gap-2">
                <button type="button" className="btn-ghost btn-sm" disabled={node.id === 1} onClick={() => setSel(node.id - 1)}>Previous</button>
                <button type="button" className="btn-ghost btn-sm" disabled={node.id === 10} onClick={() => setSel(node.id + 1)}>Next</button>
              </div>
            </motion.aside>
          </AnimatePresence>
        </div>
      </section>
      <section className="section pt-0">
        <SectionTitle eyebrow="All stages" title="Stage reference" />
        <ol className="grid gap-3 md:grid-cols-2">
          {data.nodes.map((n) => (
            <li key={n.id} className="panel p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-100"><span className="mr-2 font-mono text-xs text-aurora-cyan">{String(n.id).padStart(2, '0')}</span>{n.title}</h3>
                <StatusBadge status={n.implementation} />
              </div>
              <p className="mt-2 text-sm text-slate-400">{n.purpose}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
