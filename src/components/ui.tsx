import { type ReactNode, useId } from 'react';
import { motion } from 'framer-motion';
import { Info, TriangleAlert, FlaskConical } from 'lucide-react';
import type { ValidationStatus } from '../types/data';

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-white/5">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="section relative pb-10 md:pb-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-display mt-3 text-4xl md:text-6xl">{title}</h1>
        {children && <div className="prose-sci mt-5 text-base md:text-lg">{children}</div>}
      </div>
    </header>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'border-status-completed/40 text-status-completed bg-status-completed/10' },
  preliminary: { label: 'Preliminary', cls: 'border-status-preliminary/40 text-status-preliminary bg-status-preliminary/10' },
  'in-progress': { label: 'In progress', cls: 'border-status-progress/40 text-status-progress bg-status-progress/10' },
  planned: { label: 'Planned', cls: 'border-status-planned/40 text-status-planned bg-status-planned/10' },
  'requires-validation': { label: 'Requires validation', cls: 'border-status-validation/40 text-status-validation bg-status-validation/10' },
  simulated: { label: 'Simulated', cls: 'border-status-progress/40 text-status-progress bg-status-progress/10' },
  exploratory: { label: 'Exploratory', cls: 'border-status-preliminary/40 text-status-preliminary bg-status-preliminary/10' },
  conceptual: { label: 'Conceptual', cls: 'border-status-planned/40 text-status-planned bg-status-planned/10' },
  computational: { label: 'Computational experiment', cls: 'border-status-progress/40 text-status-progress bg-status-progress/10' },
  illustrative: { label: 'Illustrative', cls: 'border-aurora-violet/40 text-aurora-violet bg-aurora-violet/10' },
  'exploratory-hypothesis': { label: 'Exploratory hypothesis', cls: 'border-status-validation/40 text-status-validation bg-status-validation/10' },
  proposed: { label: 'Proposed', cls: 'border-status-planned/40 text-status-planned bg-status-planned/10' },
  'implemented-site': { label: 'Implemented in site simulator', cls: 'border-aurora-violet/40 text-aurora-violet bg-aurora-violet/10' },
  'implemented-experiments': { label: 'Used in experiments · verify', cls: 'border-status-progress/40 text-status-progress bg-status-progress/10' },
};

export function StatusBadge({ status }: { status: ValidationStatus | string }) {
  const s = STATUS_STYLE[status] ?? { label: status, cls: 'border-white/20 text-slate-300' };
  return <span className={`chip ${s.cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />{s.label}</span>;
}

export function Notice({ kind = 'info', title, children }: { kind?: 'info' | 'caution' | 'illustrative'; title?: string; children: ReactNode }) {
  const Icon = kind === 'caution' ? TriangleAlert : kind === 'illustrative' ? FlaskConical : Info;
  const tone =
    kind === 'caution' ? 'border-status-validation/30 bg-status-validation/[0.06] text-status-validation'
      : kind === 'illustrative' ? 'border-aurora-violet/30 bg-aurora-violet/[0.06] text-aurora-violet'
      : 'border-aurora-cyan/25 bg-aurora-cyan/[0.05] text-aurora-cyan';
  return (
    <aside className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${tone}`} role="note">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="text-slate-300">
        {title && <p className="font-medium text-slate-100">{title}</p>}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </aside>
  );
}

export function Figure({ children, caption, label, className = '' }: { children: ReactNode; caption: ReactNode; label?: string; className?: string }) {
  return (
    <figure className={`panel panel-pad ${className}`}>
      {children}
      <figcaption>{label && <span className="font-mono text-aurora-cyan/80">{label}. </span>}{caption}</figcaption>
    </figure>
  );
}

export function Slider({ label, value, min, max, step, onChange, format, hint }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string; hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="label">{label}</label>
        <output htmlFor={id} className="font-mono text-xs text-slate-200 tabular-nums">{format ? format(value) : value}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2" />
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${checked ? 'border-white/30 bg-white/10 text-slate-100' : 'border-white/10 text-slate-500'}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: checked ? color ?? '#3fd6f0' : 'transparent', border: `1px solid ${color ?? '#3fd6f0'}` }} aria-hidden />
      {label}
    </button>
  );
}

export function Loading({ error }: { error?: string | null }) {
  return (
    <div className="section">
      {error ? <Notice kind="caution" title="Content could not be loaded">{error}</Notice> : <p className="animate-pulse text-sm text-slate-500" role="status">Loading research content…</p>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h-display mt-2 text-3xl md:text-4xl">{title}</h2>
      {children && <div className="prose-sci mt-4">{children}</div>}
    </div>
  );
}
