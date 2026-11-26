import { useMemo, useRef, useState } from 'react';
import { Upload, Play, Square, Lock, Sparkles } from 'lucide-react';
import { PageHeader, Notice, Figure, Slider, SectionTitle } from '../components/ui';
import { Waveform, Spectrogram, SpectrumView, FingerprintBars } from '../visualizations/AudioViews';
import { averagedSpectrum, bandFingerprint, detectTransients, findPeaks, fingerprintSimilarity, spectrogram } from '../lib/fft';
import { mulberry32, gaussian } from '../lib/rng';

const MAX_SECONDS = 60;

interface Clip { name: string; sampleRate: number; signal: Float32Array; duration: number; truncated: boolean; synthetic: boolean }

function mixdown(buf: AudioBuffer): Float32Array {
  const n = Math.min(buf.length, Math.floor(MAX_SECONDS * buf.sampleRate));
  const out = new Float32Array(n);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += d[i] / buf.numberOfChannels;
  }
  return out;
}

/** Synthetic "tap" recording: damped modes excited by two impulses plus faint noise. Clearly labelled synthetic. */
function synthetic(kind: 'A' | 'B'): Clip {
  const sr = 44100, dur = 2.5, n = Math.floor(sr * dur);
  const modes = kind === 'A' ? [[523, 0.9, 6], [1410, 0.5, 9], [2730, 0.3, 14], [4100, 0.15, 20]] : [[610, 0.9, 11], [1580, 0.45, 16], [3050, 0.25, 24], [4900, 0.1, 30]];
  const r = mulberry32(kind === 'A' ? 11 : 23);
  const s = new Float32Array(n);
  for (const t0 of [0.25, 1.3]) {
    const i0 = Math.floor(t0 * sr);
    for (let i = i0; i < n; i++) {
      const t = (i - i0) / sr;
      let v = 0;
      for (const [f, a, d] of modes) v += a * Math.exp(-d * t) * Math.sin(2 * Math.PI * f * t);
      s[i] += 0.45 * v;
    }
  }
  for (let i = 0; i < n; i++) s[i] += 0.003 * gaussian(r);
  return { name: `Synthetic test signal ${kind}`, sampleRate: sr, signal: s, duration: dur, truncated: false, synthetic: true };
}

function analyse(c: Clip, maxPeaks: number, minDb: number) {
  const n = c.signal.length >= 16384 ? 16384 : c.signal.length >= 8192 ? 8192 : 4096;
  const spec = averagedSpectrum(c.signal, n);
  const peaks = findPeaks(spec, c.sampleRate, { maxPeaks, minDb });
  const transients = detectTransients(c.signal, c.sampleRate);
  const sg = spectrogram(c.signal, 1024, 256, 500);
  const fp = bandFingerprint(spec, c.sampleRate);
  let rms = 0; for (let i = 0; i < c.signal.length; i++) rms += c.signal[i] ** 2;
  rms = Math.sqrt(rms / c.signal.length);
  return { spec, peaks, transients, sg, fp, rms };
}

function Slot({ id, clip, onClip, onError }: { id: 'A' | 'B'; clip: Clip | null; onClip: (c: Clip) => void; onError: (m: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const load = async (f: File) => {
    setBusy(true);
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const buf = await ctx.decodeAudioData(await f.arrayBuffer());
      await ctx.close();
      onClip({ name: f.name, sampleRate: buf.sampleRate, signal: mixdown(buf), duration: Math.min(buf.duration, MAX_SECONDS), truncated: buf.duration > MAX_SECONDS, synthetic: false });
    } catch {
      onError(`Your browser could not decode “${f.name}”. WAV is the most widely supported format; M4A/AAC support varies by browser.`);
    } finally { setBusy(false); }
  };
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-100"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${id === 'A' ? 'bg-aurora-cyan' : 'bg-aurora-violet'}`} />Recording {id}</p>
        {clip?.synthetic && <span className="chip border-aurora-violet/40 text-aurora-violet">synthetic</span>}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{clip ? `${clip.name} · ${clip.duration.toFixed(2)} s · ${clip.sampleRate} Hz${clip.truncated ? ` · first ${MAX_SECONDS} s analysed` : ''}` : 'No recording loaded'}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input ref={input} type="file" accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/*" className="sr-only" id={`file-${id}`}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ''; }} />
        <label htmlFor={`file-${id}`} className="btn-ghost btn-sm cursor-pointer focus-within:ring-2" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}>
          <Upload className="h-3.5 w-3.5" aria-hidden /> {busy ? 'Decoding…' : 'Choose audio file'}
        </label>
        <button type="button" className="btn-ghost btn-sm" onClick={() => onClip(synthetic(id))}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Synthetic test signal</button>
      </div>
    </div>
  );
}

export default function AcousticLab() {
  const [a, setA] = useState<Clip | null>(null);
  const [b, setB] = useState<Clip | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [maxFreq, setMaxFreq] = useState(8000);
  const [maxPeaks, setMaxPeaks] = useState(6);
  const [minDb, setMinDb] = useState(-30);
  const [playing, setPlaying] = useState<'A' | 'B' | null>(null);
  const player = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode } | null>(null);

  const A = useMemo(() => (a ? analyse(a, maxPeaks, minDb) : null), [a, maxPeaks, minDb]);
  const B = useMemo(() => (b ? analyse(b, maxPeaks, minDb) : null), [b, maxPeaks, minDb]);
  const similarity = A && B ? fingerprintSimilarity(A.fp, B.fp) : null;

  const stop = () => { try { player.current?.src.stop(); player.current?.ctx.close(); } catch { /* already stopped */ } player.current = null; setPlaying(null); };
  const play = (which: 'A' | 'B') => {
    stop();
    const c = which === 'A' ? a : b; if (!c) return;
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, c.signal.length, c.sampleRate);
    buf.copyToChannel(new Float32Array(c.signal), 0);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.onended = () => setPlaying(null); src.start();
    player.current = { ctx, src }; setPlaying(which);
  };

  return (
    <>
      <PageHeader eyebrow="Acoustic research laboratory" title="Listening for complementary physical responses">
        <p>AURORA's acoustic investigations are exploratory proof-of-concept experiments. They ask whether the resonant and transient response of an object can help distinguish materials and measurement conditions, as a physical observable independent of optical paths.</p>
      </PageHeader>
      <section className="section space-y-6">
        <Notice title="Your recordings stay on your device">
          <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" aria-hidden />Audio is decoded and analysed entirely in your browser with the Web Audio API and a JavaScript FFT. Nothing is uploaded to any server.</span> Supported formats depend on your browser (WAV is most reliable; MP3 is widely supported; M4A varies). Up to the first {MAX_SECONDS} s are analysed, mixed to mono.
        </Notice>
        <div className="grid gap-4 md:grid-cols-2">
          <Slot id="A" clip={a} onClip={(c) => { setErr(null); setA(c); }} onError={setErr} />
          <Slot id="B" clip={b} onClip={(c) => { setErr(null); setB(c); }} onError={setErr} />
        </div>
        {err && <Notice kind="caution">{err}</Notice>}
        {!a && !b && <p className="text-sm text-slate-500">Load a recording or a synthetic test signal to begin. The synthetic signals simulate two taps on hypothetical objects with different resonant modes; they are not AURORA recordings.</p>}

        {(A || B) && (
          <div className="panel panel-pad grid gap-5 md:grid-cols-3">
            <Slider label="Maximum displayed frequency" value={maxFreq} min={1000} max={20000} step={500} onChange={setMaxFreq} format={(v) => `${(v / 1000).toFixed(1)} kHz`} />
            <Slider label="Number of peaks" value={maxPeaks} min={1} max={15} step={1} onChange={setMaxPeaks} />
            <Slider label="Peak threshold" value={minDb} min={-80} max={-6} step={1} onChange={setMinDb} format={(v) => `${v} dB`} />
          </div>
        )}

        {([['A', a, A, '#3fd6f0'], ['B', b, B, '#9d7bff']] as const).map(([id, clip, an, color]) => clip && an && (
          <div key={id} className="grid gap-6 lg:grid-cols-2">
            <Figure label={`Figure ${id}1`} caption={`Waveform of recording ${id} (normalized). Red lines mark detected transients (spectral-flux onsets above the larger of median + 4·MAD and 15% of the peak flux): ${an.transients.length ? an.transients.map((t) => `${t.toFixed(3)} s`).join(', ') : 'none detected'}. RMS level ${(20 * Math.log10(an.rms + 1e-12)).toFixed(1)} dBFS.`}>
              <div className="mb-2 flex justify-end">
                {playing === id ? <button type="button" className="btn-ghost btn-sm" onClick={stop}><Square className="h-3.5 w-3.5" aria-hidden /> Stop</button>
                  : <button type="button" className="btn-ghost btn-sm" onClick={() => play(id)}><Play className="h-3.5 w-3.5" aria-hidden /> Play</button>}
              </div>
              <Waveform signal={clip.signal} sampleRate={clip.sampleRate} transients={an.transients} color={color} label={`Waveform of recording ${id}`} />
            </Figure>
            <Figure label={`Figure ${id}2`} caption={`Spectrogram of recording ${id}: 1024-sample Hann-windowed frames, 80 dB display range, 0–${(maxFreq / 1000).toFixed(1)} kHz.`}>
              <Spectrogram data={an.sg.data} sampleRate={clip.sampleRate} hop={an.sg.hop} maxFreq={maxFreq} label={`Spectrogram of recording ${id}`} />
            </Figure>
          </div>
        ))}

        {(A || B) && (
          <Figure label="Figure 3" caption="Welch-averaged magnitude spectrum (Hann window, 50% overlap), normalized to each recording's maximum. Yellow circles mark detected peaks (local maxima above the threshold, refined by parabolic interpolation) for recording A, or B when A is empty.">
            <SpectrumView maxFreq={maxFreq} sampleRate={(a ?? b)!.sampleRate}
              series={[...(A && a ? [{ spec: A.spec, color: '#3fd6f0', name: 'A' }] : []), ...(B && b ? [{ spec: B.spec, color: '#9d7bff', name: 'B' }] : [])]}
              peaks={(A ?? B)!.peaks} />
          </Figure>
        )}

        {(A || B) && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Figure label="Table 1" caption="Peak frequencies. Frequency resolution is limited by the FFT length and the recording duration; microphone response and room acoustics also shape the result.">
              <div className="grid gap-4 sm:grid-cols-2">
                {([['A', A], ['B', B]] as const).map(([id, an]) => an && (
                  <table key={id} className="tbl">
                    <thead><tr><th>{id} · peak</th><th className="num">Hz</th><th className="num">dB</th></tr></thead>
                    <tbody>{an.peaks.map((p, i) => <tr key={i}><td>{i + 1}</td><td className="num">{p.freq.toFixed(1)}</td><td className="num">{p.db.toFixed(1)}</td></tr>)}</tbody>
                  </table>
                ))}
              </div>
            </Figure>
            <Figure label="Figure 4" caption={<>Frequency-response fingerprint: energy in 24 logarithmically spaced bands (50 Hz–16 kHz), in dB relative to the loudest band. Cyan: A; violet: B.{similarity !== null && <> Cosine similarity of the two fingerprints: <b className="text-slate-200">{similarity.toFixed(3)}</b> (1 = identical shape). A descriptive number only; it is not a validated material classifier.</>}</>}>
              <FingerprintBars a={(A ?? B)!.fp} b={A && B ? B.fp : undefined} />
            </Figure>
          </div>
        )}
      </section>

      <section className="section pt-0">
        <SectionTitle eyebrow="Method notes" title="What these tools do, and do not, show" />
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="panel p-5 text-slate-400"><h3 className="mb-2 font-medium text-slate-100">Exploratory status</h3>The acoustic work examines whether complementary physical responses can distinguish materials and measurement conditions. It has not been validated with controlled sample sets, and no material-identification claim is made.</div>
          <div className="panel p-5 text-slate-400"><h3 className="mb-2 font-medium text-slate-100">Confounding factors</h3>Excitation force and location, mounting, microphone placement and response, room reflections, and background noise all change the spectrum, sometimes more than the material does.</div>
          <div className="panel p-5 text-slate-400"><h3 className="mb-2 font-medium text-slate-100">Good practice</h3>Record several repetitions per condition, keep geometry fixed, include a silent background recording, and compare within-condition variability against between-condition differences.</div>
        </div>
      </section>
    </>
  );
}
