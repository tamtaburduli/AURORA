import { lazy, Suspense } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Home from './pages/Home';

const Research = lazy(() => import('./pages/Research'));
const Architecture = lazy(() => import('./pages/Architecture'));
const Spectral = lazy(() => import('./pages/Spectral'));
const Multimodal = lazy(() => import('./pages/Multimodal'));
const Simulator = lazy(() => import('./pages/Simulator'));
const Results = lazy(() => import('./pages/Results'));
const RadiativeTransfer = lazy(() => import('./pages/RadiativeTransfer'));
const AcousticLab = lazy(() => import('./pages/AcousticLab'));
const Mathematics = lazy(() => import('./pages/Mathematics'));
const Validation = lazy(() => import('./pages/Validation'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Archive = lazy(() => import('./pages/Archive'));
const Manuscript = lazy(() => import('./pages/Manuscript'));
const About = lazy(() => import('./pages/About'));

function NotFound() {
  return (
    <div className="section">
      <h1 className="h-display text-4xl">Page not found</h1>
      <p className="mt-4 text-slate-400">This page does not exist. <Link to="/" className="text-aurora-cyan underline">Return home</Link>.</p>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <Layout>
      <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/spectral" element={<Spectral />} />
          <Route path="/multimodal" element={<Multimodal />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/results" element={<Results />} />
          <Route path="/radiative-transfer" element={<RadiativeTransfer />} />
          <Route path="/acoustic-lab" element={<AcousticLab />} />
          <Route path="/mathematics" element={<Mathematics />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/manuscript" element={<Manuscript />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
