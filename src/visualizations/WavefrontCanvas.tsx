import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Conceptual hero visual: aurora-like spectral ribbons, wavefronts arriving at a notional sensing
 * aperture, and an interference pattern between two coherent sources. Purely decorative/conceptual —
 * it does not depict an existing instrument.
 */
export default function WavefrontCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0, w = 0, h = 0, visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);

    const ribbons = [
      { c: '52,227,164', a: 0.22, f: 0.0042, s: 0.00035, y: 0.30, amp: 0.08 },
      { c: '63,214,240', a: 0.18, f: 0.0031, s: -0.00025, y: 0.38, amp: 0.10 },
      { c: '157,123,255', a: 0.16, f: 0.0052, s: 0.0002, y: 0.24, amp: 0.06 },
      { c: '79,125,255', a: 0.14, f: 0.0024, s: 0.00015, y: 0.46, amp: 0.12 },
    ];

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // Aurora ribbons: vertical curtains of light following a slow sinusoid.
      for (const r of ribbons) {
        for (let x = 0; x < w; x += 3) {
          const yc = h * (r.y + r.amp * Math.sin(x * r.f + t * r.s * 6) + 0.03 * Math.sin(x * r.f * 3.1 - t * r.s * 9));
          const len = h * (0.16 + 0.08 * Math.sin(x * 0.011 + t * 0.0006));
          const g = ctx.createLinearGradient(0, yc - len, 0, yc + len * 0.3);
          g.addColorStop(0, `rgba(${r.c},0)`);
          g.addColorStop(0.75, `rgba(${r.c},${r.a * (0.6 + 0.4 * Math.sin(x * 0.02 + t * 0.001))})`);
          g.addColorStop(1, `rgba(${r.c},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x, yc - len, 2, len * 1.3);
        }
      }

      // Notional aperture on the right-hand side.
      const narrow = w < 768;
      const ax = narrow ? w * 0.84 : w * 0.74, ay = narrow ? h * 0.9 : h * 0.62, R = Math.min(w, h) * (narrow ? 0.14 : 0.12);
      // Incoming plane wavefronts, bending as they enter the aperture.
      ctx.lineWidth = 1;
      const phase = (t * 0.03) % 28;
      for (let i = -12; i < 22; i++) {
        const x = ax - 420 + i * 28 + phase;
        if (x > ax + R) continue;
        const alpha = Math.max(0, 0.35 - Math.abs(x - ax) / 900);
        ctx.strokeStyle = `rgba(232,238,252,${alpha})`;
        ctx.beginPath();
        const curve = x > ax - R ? (x - (ax - R)) / (2 * R) : 0;
        for (let y = ay - R * 1.8; y <= ay + R * 1.8; y += 6) {
          const dy = (y - ay) / (R * 1.8);
          const xx = x - curve * 40 * dy * dy;
          y === ay - R * 1.8 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }
      // Instrument rings.
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = k === 0 ? 'rgba(63,214,240,0.7)' : `rgba(157,123,255,${0.35 - k * 0.1})`;
        ctx.lineWidth = k === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(ax, ay, R * (1 + k * 0.28), 0, Math.PI * 2);
        ctx.stroke();
      }
      // Rotating spectral segments: five selectable channels, cycled to suggest adaptive selection.
      const active = Math.floor(t / 1400) % 5;
      const cols = ['#4f7dff', '#3fd6f0', '#34e3a4', '#f5c451', '#ff8a6b'];
      for (let k = 0; k < 5; k++) {
        const a0 = -Math.PI / 2 + k * ((Math.PI * 2) / 5) + t * 0.00008;
        ctx.strokeStyle = cols[k];
        ctx.globalAlpha = k === active ? 0.95 : 0.25;
        ctx.lineWidth = k === active ? 4 : 2.5;
        ctx.beginPath();
        ctx.arc(ax, ay, R * 0.72, a0 + 0.1, a0 + (Math.PI * 2) / 5 - 0.1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const core = ctx.createRadialGradient(ax, ay, 0, ax, ay, R * 0.5);
      core.addColorStop(0, 'rgba(63,214,240,0.55)');
      core.addColorStop(1, 'rgba(63,214,240,0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(ax, ay, R * 0.5, 0, Math.PI * 2); ctx.fill();

      // Interference of two coherent point sources (bottom-left), drawn as faint fringe arcs.
      const s1 = { x: w * 0.12, y: h * 1.02 }, s2 = { x: w * 0.2, y: h * 1.02 };
      ctx.lineWidth = 0.8;
      for (let k = 1; k < 26; k++) {
        const rr = k * 26 + ((t * 0.02) % 26);
        ctx.strokeStyle = `rgba(52,227,164,${Math.max(0, 0.16 - k * 0.006)})`;
        ctx.beginPath(); ctx.arc(s1.x, s1.y, rr, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(157,123,255,${Math.max(0, 0.16 - k * 0.006)})`;
        ctx.beginPath(); ctx.arc(s2.x, s2.y, rr, Math.PI, Math.PI * 2); ctx.stroke();
      }
    };

    const loop = (t: number) => {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    };
    if (reduced) draw(4200);
    else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [reduced]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
