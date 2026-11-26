import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ROUTES, type RouteDef } from '../routes';

const GROUPS: RouteDef['group'][] = ['Research', 'Experiments', 'Program'];

function Logo() {
  return (
    <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-md" aria-label="AURORA home">
      <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#34e3a4" /><stop offset=".5" stopColor="#3fd6f0" /><stop offset="1" stopColor="#9d7bff" /></linearGradient></defs>
        <path d="M6 44c8-20 18-20 26 0s18 20 26 0" fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="32" cy="22" r="5" fill="none" stroke="url(#lg)" strokeWidth="3" />
      </svg>
      <span className="font-display text-xl tracking-[0.3em] text-slate-50">AURORA</span>
    </Link>
  );
}

function Dropdown({ group }: { group: RouteDef['group'] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const items = ROUTES.filter((r) => r.group === group);
  const active = items.some((r) => r.path === pathname);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`focus-ring inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition ${active ? 'text-aurora-cyan' : 'text-slate-300 hover:text-white'}`}
      >
        {group} <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul className="panel absolute left-0 top-full z-50 mt-2 w-80 p-2 !bg-midnight/95">
          {items.map((r) => (
            <li key={r.path}>
              <NavLink to={r.path} className={({ isActive }) => `focus-ring block rounded-lg px-3 py-2 transition hover:bg-white/5 ${isActive ? 'bg-white/5' : ''}`}>
                <span className="block text-sm text-slate-100">{r.label}</span>
                <span className="block text-xs text-slate-500">{r.blurb}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Header() {
  const [mobile, setMobile] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMobile(false), [pathname]);
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {GROUPS.map((g) => <Dropdown key={g} group={g} />)}
          <NavLink to="/about" className={({ isActive }) => `focus-ring rounded-md px-3 py-2 text-sm ${isActive ? 'text-aurora-cyan' : 'text-slate-300 hover:text-white'}`}>About</NavLink>
          <Link to="/results" className="btn-ghost btn-sm ml-3">Results</Link>
        </div>
        <button type="button" className="focus-ring rounded-md p-2 lg:hidden" aria-expanded={mobile} aria-controls="mobile-nav" aria-label={mobile ? 'Close menu' : 'Open menu'} onClick={() => setMobile((m) => !m)}>
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {mobile && (
        <div id="mobile-nav" className="max-h-[80vh] overflow-y-auto border-t border-white/5 bg-midnight/95 px-5 pb-6 lg:hidden">
          {(['Research', 'Experiments', 'Program', 'About'] as const).map((g) => (
            <div key={g} className="mt-4">
              <p className="eyebrow mb-1">{g}</p>
              <ul>
                {ROUTES.filter((r) => r.group === g).map((r) => (
                  <li key={r.path}>
                    <NavLink to={r.path} className={({ isActive }) => `focus-ring block rounded-md px-2 py-2 text-sm ${isActive ? 'text-aurora-cyan' : 'text-slate-200'}`}>{r.label}</NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-4 md:px-8">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            An independent, ongoing research project by Tamta Burduli. AURORA is not a commercially available or fully validated physical sensor, and it is not sponsored or endorsed by any institution or agency.
          </p>
        </div>
        {(['Research', 'Experiments', 'Program'] as const).map((g) => (
          <div key={g}>
            <p className="eyebrow mb-3">{g}</p>
            <ul className="space-y-1.5">
              {ROUTES.filter((r) => r.group === g).map((r) => (
                <li key={r.path}><Link to={r.path} className="focus-ring rounded text-sm text-slate-400 hover:text-slate-100">{r.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-5 text-center text-[11px] text-slate-600">
        Figures labelled <em>illustrative</em> or <em>synthetic</em> are educational and are not experimental results. Experimental values are preliminary.
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const r = ROUTES.find((x) => x.path === pathname);
    document.title = r && r.path !== '/' ? `${r.label} · AURORA` : 'AURORA — Adaptive Uncertainty-aware Radiative Observation and Ranging Architecture';
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link btn-primary" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <Footer />
    </div>
  );
}
