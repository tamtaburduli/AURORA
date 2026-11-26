/** Small accessible correlation heatmap (values in [-1, 1]). */
export default function Heatmap({ matrix, labels, title }: { matrix: number[][]; labels: string[]; title: string }) {
  const n = labels.length, cell = 46, pad = 54;
  const color = (v: number) => {
    const a = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(255,138,107,${0.12 + 0.78 * a})` : `rgba(79,125,255,${0.12 + 0.78 * a})`;
  };
  return (
    <svg viewBox={`0 0 ${pad + n * cell + 4} ${pad + n * cell + 4}`} className="h-auto w-full max-w-sm" role="img" aria-label={title}>
      <title>{title}</title>
      {labels.map((l, i) => (
        <g key={l + i}>
          <text x={pad + i * cell + cell / 2} y={pad - 10} fill="#8b97b5" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{l}</text>
          <text x={pad - 8} y={pad + i * cell + cell / 2 + 3} fill="#8b97b5" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono, monospace">{l}</text>
        </g>
      ))}
      {matrix.map((row, i) => row.map((v, j) => (
        <g key={`${i}-${j}`}>
          <rect x={pad + j * cell + 1} y={pad + i * cell + 1} width={cell - 2} height={cell - 2} rx="4" fill={color(v)} />
          <text x={pad + j * cell + cell / 2} y={pad + i * cell + cell / 2 + 4} fill="#03050b" fontSize="11" fontWeight="600" textAnchor="middle">{v.toFixed(2)}</text>
        </g>
      )))}
    </svg>
  );
}
