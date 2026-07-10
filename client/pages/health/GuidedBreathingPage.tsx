import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';

// ─── Breathing patterns ─────────────────────────────────────────────────────
// Each pattern is a cycle of phases. A phase with `secs === 0` is skipped (so
// the same shape covers box-breathing, 4-7-8 and a simple two-beat calm cycle).
type PhaseKind = 'inhale' | 'hold' | 'exhale' | 'hold2';

interface Phase {
  kind: PhaseKind;
  label: string;
  secs: number;
}

interface Pattern {
  key: string;
  name: string;
  blurb: string;
  phases: Phase[];
}

const PATTERNS: [Pattern, ...Pattern[]] = [
  {
    key: 'box',
    name: 'Box (4·4·4·4)',
    blurb: 'Inhale, hold, exhale, hold — equal counts. Steadying.',
    phases: [
      { kind: 'inhale', label: 'Inhale', secs: 4 },
      { kind: 'hold', label: 'Hold', secs: 4 },
      { kind: 'exhale', label: 'Exhale', secs: 4 },
      { kind: 'hold2', label: 'Hold', secs: 4 },
    ],
  },
  {
    key: '478',
    name: '4-7-8',
    blurb: 'Inhale 4, hold 7, exhale 8. For winding down.',
    phases: [
      { kind: 'inhale', label: 'Inhale', secs: 4 },
      { kind: 'hold', label: 'Hold', secs: 7 },
      { kind: 'exhale', label: 'Exhale', secs: 8 },
      { kind: 'hold2', label: 'Hold', secs: 0 },
    ],
  },
  {
    key: 'calm',
    name: 'Calm (4·6)',
    blurb: 'Inhale 4, exhale 6 — a longer out-breath to settle.',
    phases: [
      { kind: 'inhale', label: 'Inhale', secs: 4 },
      { kind: 'hold', label: 'Hold', secs: 0 },
      { kind: 'exhale', label: 'Exhale', secs: 6 },
      { kind: 'hold2', label: 'Hold', secs: 0 },
    ],
  },
];

// Muted-rainbow tints used for the concentric rings (read from madison.css vars
// where possible, with calm fallbacks).
const RING_COLORS = [
  'var(--mr-red, #c98a8a)',
  'var(--mr-orange, #d6a679)',
  'var(--mr-yellow, #cfc285)',
  'var(--mr-green, #8fb592)',
  'var(--mr-blue, #8aa7c9)',
  'var(--mr-violet, #a892c4)',
];

const READY_PHASE: Phase = { kind: 'inhale', label: 'Inhale', secs: 4 };

function activePhases(p: Pattern): Phase[] {
  return p.phases.filter((ph) => ph.secs > 0);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// GuidedBreathingPage — a calming, purely client-side guided-breathing visual.
// A set of concentric polygons + a flower-of-life-ish ring of circles expands on
// the inhale, holds, and contracts on the exhale, with the shape slowly rotating.
// All animation is driven by requestAnimationFrame off a wall-clock so it stays
// smooth and never depends on data or the server.
export default function GuidedBreathingPage(): ReactElement {
  const [patternKey, setPatternKey] = useState<string>('box');
  const [running, setRunning] = useState(false);
  const [phaseLabel, setPhaseLabel] = useState('Ready');
  const [count, setCount] = useState(0);
  // 0 = fully contracted (end of exhale), 1 = fully expanded (end of inhale).
  const [scale, setScale] = useState(0);
  const [rotation, setRotation] = useState(0);

  const pattern = useMemo(
    () => PATTERNS.find((p) => p.key === patternKey) ?? PATTERNS[0],
    [patternKey],
  );
  const phases = useMemo(() => activePhases(pattern), [pattern]);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const reduced = useMemo(prefersReducedMotion, []);

  // Reset visual state when stopping or switching pattern.
  useEffect(() => {
    if (!running) {
      setPhaseLabel('Ready');
      setCount(0);
      setScale(0);
      setRotation(0);
    }
  }, [running, patternKey]);

  useEffect(() => {
    if (!running) return;
    const totalCycle = phases.reduce((s, p) => s + p.secs, 0);
    if (totalCycle <= 0) return;
    startRef.current = performance.now();

    const tick = (now: number): void => {
      const elapsed = (now - startRef.current) / 1000;
      const t = elapsed % totalCycle; // seconds into the current cycle

      // Find the active phase and how far through it we are (0..1).
      let acc = 0;
      let current: Phase = phases[0] ?? READY_PHASE;
      let frac = 0;
      for (const ph of phases) {
        if (t < acc + ph.secs) {
          current = ph;
          frac = (t - acc) / ph.secs;
          break;
        }
        acc += ph.secs;
      }

      // Map phase → target scale. Inhale ramps 0→1, exhale ramps 1→0, holds
      // sit at the appropriate extreme. Eased with a cosine for softness.
      const ease = (x: number): number => 0.5 - 0.5 * Math.cos(Math.PI * x);
      let s = 0;
      if (current.kind === 'inhale') s = ease(frac);
      else if (current.kind === 'exhale') s = 1 - ease(frac);
      else if (current.kind === 'hold') s = 1; // hold after inhale → expanded
      else s = 0; // hold2 after exhale → contracted

      setScale(s);
      setPhaseLabel(current.label);
      setCount(Math.max(1, Math.ceil(current.secs - frac * current.secs)));
      // Slow, continuous rotation — much calmer than the chaos elsewhere.
      setRotation((elapsed * 8) % 360);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, phases]);

  // Geometry — a flower-of-life-style ring of circles + nested polygons.
  // Scale 0..1 maps to a visual scale of 0.45..1.0 around the center.
  const visScale = 0.45 + 0.55 * scale;
  const cx = 160;
  const cy = 160;
  const baseR = 110;

  // Six satellite circles (flower of life outer ring).
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    const dist = baseR * 0.5 * visScale;
    return {
      x: cx + Math.cos(a) * dist,
      y: cy + Math.sin(a) * dist,
      r: baseR * 0.5 * visScale,
      color: RING_COLORS[i % RING_COLORS.length],
    };
  });

  return (
    <Win9xWindow
      title="breathing.exe — Guided Breathing"
      className="article-win"
      bodyClassName="doc-body"
    >
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        ›{' '}
        <Link to="corner/:corner" params={{ corner: 'health' }} style={{ color: 'inherit' }}>
          Health Corner
        </Link>{' '}
        › Guided Breathing
      </div>

      <h1 className="article" style={{ textAlign: 'center' }}>
        <span aria-hidden>❀</span> Guided Breathing <span aria-hidden>❀</span>
      </h1>
      <p
        className="note"
        style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 12px' }}
      >
        Pick a rhythm, press start, and let the shape pace your breath. Slow and
        gentle — no rush.
      </p>

      {/* ── Pattern selector ───────────────────────────────────────────────── */}
      <div
        role="radiogroup"
        aria-label="Breathing pattern"
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          margin: '8px 0 16px',
        }}
      >
        {PATTERNS.map((p) => {
          const selected = p.key === patternKey;
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={selected}
              title={p.blurb}
              onClick={() => {
                setRunning(false);
                setPatternKey(p.key);
              }}
              className="tbtn"
              style={{
                fontWeight: selected ? 700 : 400,
                outline: selected ? '2px solid var(--panel-edge)' : 'none',
              }} data-id="name"
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* ── The visual ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', placeItems: 'center', margin: '8px 0' }}>
        <svg
          viewBox="0 0 320 320"
          width={320}
          height={320}
          role="img"
          aria-label={`Breathing guide, currently ${phaseLabel}`}
          style={{ maxWidth: '100%', display: 'block' }}
        >
          <g
            transform={`rotate(${reduced ? 0 : rotation} ${cx} ${cy})`}
            style={{ transition: 'transform 0.08s linear' }}
          >
            {/* outer guide ring */}
            <circle
              cx={cx}
              cy={cy}
              r={baseR * visScale}
              fill="none"
              stroke="var(--panel-edge, #6b6b8a)"
              strokeWidth={1.5}
              opacity={0.35}
            />
            {/* flower-of-life petals */}
            {petals.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill="none"
                stroke={p.color}
                strokeWidth={2}
                opacity={0.85}
              />
            ))}
            {/* center pulse */}
            <circle
              cx={cx}
              cy={cy}
              r={baseR * 0.22 * visScale}
              fill="var(--mr-violet, #a892c4)"
              opacity={0.45}
            />
          </g>
        </svg>

        {/* phase label + countdown */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div
            style={{
              fontFamily: 'var(--orn-font)',
              fontSize: '1.6em',
              lineHeight: 1.1,
            }}
          >
            {phaseLabel}
          </div>
          {running && (
            <div className="note" style={{ fontSize: '1.2em', marginTop: 2 }}>
              {count}
            </div>
          )}
        </div>
      </div>

      {/* ── Start / Stop ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          className="tbtn"
          onClick={() => { setRunning((r) => !r); }}
          style={{ fontSize: '1.05em', padding: '6px 22px' }} data-id="button"
        >
          {running ? 'Stop' : 'Start'}
        </button>
      </div>

      {reduced && (
        <p className="note" style={{ textAlign: 'center', marginTop: 10 }}>
          Reduced-motion is on — the shape won&apos;t rotate. Use Start when
          you&apos;re ready; nothing moves until then.
        </p>
      )}
    </Win9xWindow>
  );
}
