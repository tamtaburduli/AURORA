import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader, Loading, StatusBadge, Notice } from '../components/ui';
import { useData } from '../hooks/useData';
import type { TimelineData, ValidationStatus } from '../types/data';

const DOT: Record<ValidationStatus, string> = {
  completed: 'bg-status-completed', preliminary: 'bg-status-preliminary', 'in-progress': 'bg-status-progress', planned: 'bg-status-planned', 'requires-validation': 'bg-status-validation',
};
const ALL: ValidationStatus[] = ['completed', 'preliminary', 'in-progress', 'planned', 'requires-validation'];

export default function Timeline() {
  const { data, error } = useData<TimelineData>('timeline.json');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ValidationStatus | 'all'>('all');
  if (!data) return <Loading error={error} />;
  const items = data.milestones.filter((m) => filter === 'all' || m.status === filter);
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <>
      <PageHeader eyebrow="Research development timeline" title="From hypothesis to validation">
        <p>The sequence of AURORA research stages. Dates are intentionally omitted until confirmed; status labels show where each stage stands.</p>
      </PageHeader>
      <section className="section">
        <Notice>Statuses marked “to be confirmed” are drafts. Edit <code className="font-mono text-xs">public/data/timeline.json</code> to update them.</Notice>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className={`chip focus-ring ${filter === 'all' ? 'border-white/40 text-slate-100' : 'border-white/10 text-slate-500'}`}>All</button>
          {ALL.map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`focus-ring rounded-full ${filter === s ? '' : 'opacity-50 hover:opacity-90'}`}><StatusBadge status={s} /></button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(new Set(items.map((m) => m.id)))}>Expand all</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(new Set())}>Collapse all</button>
        </div>
        <ol className="relative mt-10 border-l border-white/10 pl-8">
          {items.map((m, i) => {
            const isOpen = open.has(m.id);
            return (
              <li key={m.id} className="relative mb-6">
                <span className={`absolute -left-[38px] top-4 h-3.5 w-3.5 rounded-full ring-4 ring-void ${DOT[m.status]}`} aria-hidden />
                <div className="panel">
                  <button type="button" onClick={() => toggle(m.id)} aria-expanded={isOpen} aria-controls={`tl-${m.id}`} className="focus-ring flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-left">
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500">{String(data.milestones.indexOf(m) + 1).padStart(2, '0')}</span>
                      <span className="font-medium text-slate-100">{m.title}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      {!m.statusConfirmed && <span className="hidden text-[10px] text-slate-500 sm:inline">to be confirmed</span>}
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div id={`tl-${m.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-white/5 px-4 pb-4 pt-3 text-sm">
                          <p className="text-slate-300">{m.description}</p>
                          <p className="mt-2 text-xs text-slate-500">Period: {m.period ?? 'not specified'}</p>
                          {m.outputs.length > 0 && <p className="mt-1 text-xs text-slate-500">Related outputs: {m.outputs.join(' · ')}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {i === items.length - 1 && null}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
