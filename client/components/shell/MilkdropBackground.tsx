import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

// ─── MilkdropBackground ───────────────────────────────────────────────────────
// Ported from design-mocks/v3-01-retro-earthy-milkdrop.html. Builds a silent
// Web-Audio ambient synth graph (3 detuned oscillators + noise + LFO into a
// lowpass filter) and a Butterchurn (Milkdrop) visualizer tied to that filter
// node, so the viz renders from mount and becomes audio-reactive once audio is
// playing. Butterchurn is loaded from CDN (client-only, in a useEffect — never
// during SSR / Workers render).
//
// Imperative handle:
//   connectTrackAudio(el)  — pipe a real <audio>/<video> element's
//                            MediaElementSource into the viz + speakers, so the
//                            Milkdrop reacts to a real CMS track.
//   getAudioContext()      — shared AudioContext (the player ramps the synth).
//   getSynthGain()         — master gain of the ambient synth (0 = silent).
//   getSynthFilter()       — the filter node the synth feeds (for retuning).
//   resume()               — resume a suspended context after a user gesture.
//   loadRandomPreset()     — swap to a random Milkdrop preset (secret eggs).
//   setOpacity(v)          — 0..1 viz canvas opacity (intensity slider / chaos).

export interface MilkdropHandle {
  connectTrackAudio: (el: HTMLMediaElement) => void;
  getAudioContext: () => AudioContext | null;
  getSynthGain: () => GainNode | null;
  getSynthFilter: () => BiquadFilterNode | null;
  resume: () => void;
  loadRandomPreset: () => void;
  setOpacity: (v: number) => void;
}

interface ButterchurnVisualizer {
  connectAudio: (node: AudioNode) => void;
  loadPreset: (preset: unknown, blendTime: number) => void;
  render: () => void;
  setRendererSize: (w: number, h: number) => void;
}

interface ButterchurnGlobal {
  createVisualizer: (
    ctx: AudioContext,
    canvas: HTMLCanvasElement,
    opts: { width: number; height: number; pixelRatio: number },
  ) => ButterchurnVisualizer;
}

interface ButterchurnPresetsGlobal {
  getPresets: () => Record<string, unknown>;
}

interface MilkdropWindow extends Window {
  butterchurn?: ButterchurnGlobal | { default?: ButterchurnGlobal };
  butterchurnPresets?:
    | ButterchurnPresetsGlobal
    | { default?: ButterchurnPresetsGlobal };
  webkitAudioContext?: typeof AudioContext;
}

const BUTTERCHURN_SRC = 'https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js';
const PRESETS_SRC = 'https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') { resolve(); return; }
      existing.addEventListener('load', () => { resolve(); }, { once: true });
      existing.addEventListener('error', () => { reject(new Error(`failed: ${src}`)); }, { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.addEventListener('load', () => { s.dataset.loaded = 'true'; resolve(); }, { once: true });
    s.addEventListener('error', () => { reject(new Error(`failed: ${src}`)); }, { once: true });
    document.head.appendChild(s);
  });
}

const MilkdropBackground = forwardRef<MilkdropHandle>(function MilkdropBackground(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const visualizerRef = useRef<ButterchurnVisualizer | null>(null);
  const presetsRef = useRef<Record<string, unknown> | null>(null);
  const presetKeysRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const connectedEls = useRef<WeakSet<HTMLMediaElement>>(new WeakSet());

  function loadRandomPreset(): void {
    const viz = visualizerRef.current;
    const presets = presetsRef.current;
    const keys = presetKeysRef.current;
    if (!viz || !presets || keys.length === 0) return;
    const k = keys[Math.floor(Math.random() * keys.length)];
    if (k === undefined) return;
    const preset = presets[k];
    try { viz.loadPreset(preset, 1.2); } catch { /* ignore */ }
  }

  useImperativeHandle(ref, (): MilkdropHandle => ({
    connectTrackAudio: (el: HTMLMediaElement) => {
      const ctx = audioCtxRef.current;
      const filter = filterRef.current;
      if (!ctx || !filter) return;
      if (connectedEls.current.has(el)) return;
      try {
        const src = ctx.createMediaElementSource(el);
        // Route the real track to both the speakers AND the viz filter node so
        // Milkdrop reacts to the actual audio.
        src.connect(ctx.destination);
        src.connect(filter);
        connectedEls.current.add(el);
      } catch {
        // A media element can only be wired into one MediaElementSource ever.
      }
    },
    getAudioContext: () => audioCtxRef.current,
    getSynthGain: () => masterRef.current,
    getSynthFilter: () => filterRef.current,
    resume: () => {
      const ctx = audioCtxRef.current;
      if (ctx?.state === 'suspended') void ctx.resume();
    },
    loadRandomPreset,
    setOpacity: (v: number) => {
      const c = canvasRef.current;
      if (c) c.style.opacity = String(v);
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    const w = window as MilkdropWindow;

    // ── Build the silent ambient synth graph ────────────────────────────────
    function ensureAudio(): void {
      if (audioCtxRef.current) return;
      // Standard constructor, with a webkit-prefixed fallback for old Safari.
      // The DOM lib types `window.AudioContext` as always-present, so the
      // runtime feature-detect reads as "unnecessary" to the linter — but it
      // genuinely matters on legacy WebKit, hence the targeted disable.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const AudioCtor = window.AudioContext as typeof AudioContext | undefined ?? w.webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0; // silent until the player ramps it
      master.connect(ctx.destination);
      masterRef.current = master;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      filter.Q.value = 6;
      filter.connect(master);
      filterRef.current = filter;

      // 3 detuned oscillators
      [1, 1.5, 2].forEach((m, i) => {
        const o = ctx.createOscillator();
        o.type = i === 2 ? 'triangle' : 'sawtooth';
        o.frequency.value = 110 * m;
        o.detune.value = (i - 1) * 7;
        const g = ctx.createGain();
        g.gain.value = 0.12 / (i + 1);
        o.connect(g); g.connect(filter); o.start();
      });

      // soft noise layer
      const bufSize = ctx.sampleRate * 2;
      const nb = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const dat = nb.getChannelData(0);
      for (let i = 0; i < bufSize; i++) dat[i] = (Math.random() * 2 - 1) * 0.25;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = nb; noiseSrc.loop = true;
      const ng = ctx.createGain(); ng.gain.value = 0.025;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 500;
      noiseSrc.connect(nf); nf.connect(ng); ng.connect(filter); noiseSrc.start();

      // slow LFO on filter cutoff
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    }

    function initViz(): void {
      const canvas = canvasRef.current;
      const ctx = audioCtxRef.current;
      const filter = filterRef.current;
      if (!canvas || !ctx || !filter) return;
      try {
        const bcRaw = w.butterchurn;
        const ppRaw = w.butterchurnPresets;
        const BC = (bcRaw && 'default' in bcRaw ? bcRaw.default : bcRaw) as ButterchurnGlobal | undefined;
        const PP = (ppRaw && 'default' in ppRaw ? ppRaw.default : ppRaw) as ButterchurnPresetsGlobal | undefined;
        if (!BC || !PP) throw new Error('butterchurn not loaded');
        const presets = PP.getPresets();
        const keys = Object.keys(presets);
        if (keys.length === 0) throw new Error('no presets');
        presetsRef.current = presets;
        presetKeysRef.current = keys;

        const viz = BC.createVisualizer(ctx, canvas, {
          width: window.innerWidth,
          height: window.innerHeight,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
        });
        visualizerRef.current = viz;
        try { viz.connectAudio(filter); } catch { /* ignore */ }
        // Force the renderer to the current viewport so the initial frame
        // isn't rendered at a stale/zoomed size.
        try { viz.setRendererSize(window.innerWidth, window.innerHeight); } catch { /* ignore */ }
        loadRandomPreset();

        const loop = (): void => {
          try { viz.render(); } catch { /* ignore */ }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.warn('Butterchurn failed, fallback bg:', err);
        if (canvasRef.current) canvasRef.current.style.display = 'none';
        if (fallbackRef.current) fallbackRef.current.style.display = 'block';
      }
    }

    function onResize(): void {
      // Let Butterchurn own the canvas backing store — it applies pixelRatio
      // internally. Manually setting canvas.width/height to CSS pixels fought
      // the 2x pixelRatio and rendered the visual zoomed-in/cropped.
      const viz = visualizerRef.current;
      if (viz) { try { viz.setRendererSize(window.innerWidth, window.innerHeight); } catch { /* ignore */ } }
    }

    ensureAudio();
    void Promise.all([loadScript(BUTTERCHURN_SRC), loadScript(PRESETS_SRC)])
      .then(() => { if (!cancelled) initViz(); })
      .catch((err: unknown) => {
        console.warn('Butterchurn CDN load failed:', err);
        if (fallbackRef.current) fallbackRef.current.style.display = 'block';
        if (canvasRef.current) canvasRef.current.style.display = 'none';
      });

    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <canvas className="viz-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="viz-fallback" ref={fallbackRef} style={{ display: 'none' }} aria-hidden="true" />
      <div className="viz-scrim" aria-hidden="true" />
    </>
  );
});

export default MilkdropBackground;
