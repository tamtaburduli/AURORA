import katex from 'katex';
import { useMemo } from 'react';

/** Renders a KaTeX expression. `display` produces a centred block equation. */
export default function Tex({ children, display = false, label }: { children: string; display?: boolean; label?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: display, throwOnError: false, strict: 'ignore' }),
    [children, display],
  );
  const Tag = display ? 'div' : 'span';
  return <Tag aria-label={label} dangerouslySetInnerHTML={{ __html: html }} />;
}
