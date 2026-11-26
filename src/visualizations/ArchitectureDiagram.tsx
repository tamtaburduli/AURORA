import { useReducedMotion } from '../hooks/useReducedMotion';
import type { ArchNode } from '../types/data';

const W = 160, H = 66;
const COLS = [20, 215, 410, 605, 800];
const ROW1 = 70, ROW2 = 270;

/** Grid position of each of the ten stages: top row left→right, bottom row right→left. */
const POS: Record<number, { x: number; y: number }> = {
  1: { x: COLS[0], y: ROW1 }, 2: { x: COLS[1], y: ROW1 }, 3: { x: COLS[2], y: ROW1 }, 4: { x: COLS[3], y: ROW1 }, 5: { x: COLS[4], y: ROW1 },
  6: { x: COLS[4], y: ROW2 }, 7: { x: COLS[3], y: ROW2 }, 8: { x: COLS[2], y: ROW2 }, 9: { x: COLS[1], y: ROW2 }, 10: { x: COLS[0], y: ROW2 },
};

const IMPL_COLOR: Record<string, string> = { computational: '#3fd6f0', conceptual: '#9aa6c4', illustrative: '#9d7bff' };

export default function ArchitectureDiagram({ nodes, selected, onSelect, showStatus }: {
  nodes: ArchNode[]; selected: number; onSelect: (id: number) => void; showStatus: boolean;
}) {
  const reduced = useReducedMotion();
  const c = (id: number) => ({ cx: POS[id].x + W / 2, cy: POS[id].y + H / 2 });
  const edge = (a: number, b: number) => {
    const A = c(a), B = c(b);
    if (A.cy === B.cy) {
      const dir = B.cx > A.cx ? 1 : -1;
      return `M${A.cx + (dir * W) / 2} ${A.cy} L${B.cx - (dir * W) / 2 - dir * 6} ${B.cy}`;
    }
    return `M${A.cx} ${A.cy + H / 2} L${B.cx} ${B.cy - H / 2 - 6}`;
  };
  // Feedback: from Decision (10) back up to Uncertainty assessment (5), around the bottom and right edge.
  const fb = `M${c(10).cx} ${ROW2 + H} C ${c(10).cx} ${ROW2 + H + 70}, ${COLS[4] + W + 40} ${ROW2 + H + 70}, ${COLS[4] + W + 40} ${ROW2 + H / 2} L ${COLS[4] + W + 40} ${ROW1 + H / 2} L ${COLS[4] + W + 6} ${ROW1 + H / 2}`;
  // Physical interaction: acquisition (8) samples the environment (1).
  const phys = `M${c(8).cx - 40} ${ROW2} C ${c(8).cx - 60} ${ROW1 + H + 70}, ${c(1).cx + 30} ${ROW1 + H + 70}, ${c(1).cx + 30} ${ROW1 + H + 6}`;

  return (
    <svg viewBox="0 0 1040 430" className="h-auto w-full" role="group" aria-label="AURORA adaptive sensing architecture. Ten stages connected in a feedback loop; select a stage for details.">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#3fd6f0" /></marker>
        <marker id="arrv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#9d7bff" /></marker>
        <marker id="arrg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#34e3a4" /></marker>
        <linearGradient id="nodeg" x1="0" x2="1"><stop offset="0" stopColor="rgba(63,214,240,0.10)" /><stop offset="1" stopColor="rgba(157,123,255,0.08)" /></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <path key={i} d={edge(i, i + 1)} stroke="#3fd6f0" strokeOpacity="0.55" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
      ))}
      <path id="fbpath" d={fb} stroke="#9d7bff" strokeWidth="1.8" fill="none" markerEnd="url(#arrv)" className={reduced ? '' : 'flow-dash'} strokeDasharray={reduced ? '6 8' : undefined} />
      <text x={COLS[4] + W + 50} y={(ROW1 + ROW2 + H) / 2} fill="#9d7bff" fontSize="11" fontFamily="JetBrains Mono, monospace" transform={`rotate(90 ${COLS[4] + W + 50} ${(ROW1 + ROW2 + H) / 2})`} textAnchor="middle">continue adaptive observation</text>
      <path d={phys} stroke="#34e3a4" strokeOpacity="0.5" strokeWidth="1.2" fill="none" strokeDasharray="3 5" markerEnd="url(#arrg)" />
      <text x={(c(1).cx + c(8).cx) / 2 - 20} y={ROW1 + H + 62} fill="#34e3a4" fillOpacity="0.8" fontSize="10.5" fontFamily="JetBrains Mono, monospace" textAnchor="middle">physical interaction</text>
      {/* Exit to final retrieval */}
      <path d={`M${COLS[0]} ${ROW2 + H / 2} L 4 ${ROW2 + H / 2}`} stroke="#34e3a4" strokeWidth="1.5" markerEnd="url(#arrg)" />
      <text x={COLS[0] + 4} y={ROW2 + H + 92} fill="#34e3a4" fontSize="11" fontFamily="JetBrains Mono, monospace">← final retrieval when sufficient</text>

      {!reduced && (
        <circle r="5" fill="#e8eefc" filter="url(#glow)">
          <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#fbpath" /></animateMotion>
        </circle>
      )}

      {nodes.map((n) => {
        const p = POS[n.id];
        const sel = n.id === selected;
        const stroke = showStatus ? IMPL_COLOR[n.implementation] : sel ? '#3fd6f0' : 'rgba(255,255,255,0.18)';
        return (
          <g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            aria-label={`Stage ${n.id}: ${n.title}`}
            onClick={() => onSelect(n.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(n.id); } }}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-aurora-cyan"
          >
            <rect x={p.x} y={p.y} width={W} height={H} rx="12" fill={sel ? 'rgba(63,214,240,0.14)' : 'url(#nodeg)'} stroke={stroke} strokeWidth={sel ? 2 : 1.2}
              strokeDasharray={showStatus && n.implementation === 'conceptual' ? '5 4' : undefined} filter={sel ? 'url(#glow)' : undefined} />
            <text x={p.x + 14} y={p.y + 24} fill="#3fd6f0" fontSize="11" fontFamily="JetBrains Mono, monospace">{String(n.id).padStart(2, '0')}</text>
            <text x={p.x + 14} y={p.y + 46} fill="#e8eefc" fontSize="14" fontFamily="Inter, sans-serif">{n.short}</text>
          </g>
        );
      })}
    </svg>
  );
}
