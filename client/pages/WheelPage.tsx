import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { apiPost } from '../api';
import Win9xWindow from '../components/Win9xWindow';
import { Link } from '../router';
import { WHEEL_PRESETS, type Wheel } from '../../shared/wheel';

// Muted-rainbow palette (matches the `--mr-*` CSS vars). Segments cycle through
// these so adjacent slices stay visually distinct without going neon.
const MR_COLORS = [
  'var(--mr-red)',
  'var(--mr-orange)',
  'var(--mr-yellow)',
  'var(--mr-lime)',
  'var(--mr-green)',
  'var(--mr-teal)',
  'var(--mr-cyan)',
  'var(--mr-blue)',
  'var(--mr-indigo)',
  'var(--mr-purple)',
  'var(--mr-magenta)',
  'var(--mr-pink)',
  'var(--mr-lilac)',
] as const;

interface WheelOption {
  id: string;
  name: string;
  slices: string[];
  builtin: boolean;
}

// Build the conic-gradient `background` for N equal slices, coloured from the
// muted-rainbow palette. Slice i occupies [i*seg, (i+1)*seg) starting at the
// top (12 o'clock), matching how the landed-slice math below reads the angle.
function conicBackground(n: number): string {
  const seg = 360 / n;
  const stops: string[] = [];
  for (let i = 0; i < n; i++) {
    const color = MR_COLORS[i % MR_COLORS.length];
    stops.push(`${color} ${i * seg}deg ${(i + 1) * seg}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
}

// Given a final wheel rotation (degrees clockwise) and slice count, return the
// index of the slice sitting under the fixed top pointer.
//
// The pointer is at screen angle 0 (top). A slice originally centred at wheel
// angle `a` appears at screen angle `(a + rotation) mod 360`. So the slice under
// the pointer is the one whose original span contains `(360 - (rotation mod
// 360)) mod 360`.
function landedSlice(rotation: number, n: number): number {
  const seg = 360 / n;
  const norm = ((rotation % 360) + 360) % 360;
  const pointerAngle = (360 - norm) % 360;
  return Math.floor(pointerAngle / seg) % n;
}

// Compute a new absolute rotation that spins several extra turns and lands the
// CENTRE of `targetIndex` under the pointer. Always rotates forward (clockwise)
// past the current rotation so the CSS transition animates a satisfying multi-
// rotation spin.
function rotationForTarget(current: number, targetIndex: number, n: number): number {
  const seg = 360 / n;
  const centre = targetIndex * seg + seg / 2;
  // We need final rotation R such that (360 - (R mod 360)) mod 360 === centre,
  // i.e. R mod 360 === (360 - centre) mod 360.
  const desiredMod = ((360 - centre) % 360 + 360) % 360;
  const extraTurns = 4 + Math.floor(Math.random() * 3); // 4..6 full turns
  const base = current - (current % 360) + extraTurns * 360;
  let next = base + desiredMod;
  while (next <= current + 360) next += 360; // guarantee a real forward spin
  return next;
}

export default function WheelPage(): ReactElement {
  const [customWheels, setCustomWheels] = useState<Wheel[]>([]);
  const [selectedId, setSelectedId] = useState<string>(WHEEL_PRESETS[0]?.id ?? '');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { wheels } = await apiPost<{ wheels: Wheel[] }>('listWheels', {});
        if (active) setCustomWheels(wheels);
      } catch {
        // Logged-out / offline visitors still get the built-in presets.
      }
    })();
    return () => {
      active = false;
      if (spinTimer.current !== null) window.clearTimeout(spinTimer.current);
    };
  }, []);

  const options = useMemo<WheelOption[]>(() => {
    const presets: WheelOption[] = WHEEL_PRESETS.map((p) => ({
      id: `preset:${p.id}`,
      name: p.name,
      slices: p.slices,
      builtin: true,
    }));
    const customs: WheelOption[] = customWheels.map((w) => ({
      id: `custom:${w._id}`,
      name: w.name,
      slices: w.slices,
      builtin: false,
    }));
    return [...presets, ...customs];
  }, [customWheels]);

  // Keep selection valid as options load.
  useEffect(() => {
    if (options.length === 0) return;
    const stillThere = options.some((o) => o.id === selectedId);
    const presetFallback = `preset:${WHEEL_PRESETS[0]?.id ?? ''}`;
    if (!stillThere) setSelectedId(options[0]?.id ?? presetFallback);
  }, [options, selectedId]);

  const active =
    options.find((o) => o.id === selectedId) ??
    options.find((o) => o.id === `preset:${WHEEL_PRESETS[0]?.id ?? ''}`) ??
    options[0] ??
    null;

  const slices = active?.slices ?? [];
  const n = slices.length;
  const seg = n > 0 ? 360 / n : 360;

  function handleSpin(): void {
    if (spinning || n < 2) return;
    setResult(null);
    setSpinning(true);
    const target = Math.floor(Math.random() * n);
    const next = rotationForTarget(rotation, target, n);
    setRotation(next);
    // Settle after the CSS transition; read the landed slice deterministically
    // from the final angle (it agrees with `target` by construction).
    spinTimer.current = window.setTimeout(() => {
      const landed = landedSlice(next, n);
      setResult(slices[landed] ?? slices[target] ?? null);
      setSpinning(false);
    }, 4200);
  }

  function selectWheel(id: string): void {
    if (spinning) return;
    setSelectedId(id);
    setResult(null);
  }

  return (
    <Win9xWindow title="wheel.exe — Wheel of Fortune" className="article-win" bodyClassName="doc-body">
      <style>{`
        @keyframes wof-pop {
          0%   { opacity: 0; transform: scale(.8); }
          60%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        › Wheel of Fortune
      </div>

      <h1 className="article" style={{ textAlign: 'center' }}>
        <span aria-hidden>★</span> Wheel of Fortune <span aria-hidden>★</span>
      </h1>
      <p className="note" style={{ textAlign: 'center' }}>
        Pick a wheel, give it a spin, and let fate decide.
      </p>

      {/* Wheel picker */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '14px 0' }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="tbtn"
            aria-pressed={o.id === selectedId}
            disabled={spinning}
            onClick={() => selectWheel(o.id)}
            style={o.id === selectedId ? { borderColor: 'var(--text)', fontWeight: 700 } : undefined}
          >
            {o.name}
            {!o.builtin && <span aria-hidden> ✦</span>}
          </button>
        ))}
      </div>

      {n < 2 ? (
        <p className="note" style={{ textAlign: 'center' }}>this wheel needs at least two slices.</p>
      ) : (
        <>
          {/* The wheel + pointer */}
          <div
            style={{
              position: 'relative',
              width: 'min(360px, 80vw)',
              aspectRatio: '1 / 1',
              margin: '8px auto 4px',
            }}
          >
            {/* Fixed pointer at the top (12 o'clock), pointing down into the wheel */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '24px solid var(--text)',
                zIndex: 3,
                filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.25))',
              }}
            />
            <div
              role="img"
              aria-label={`wheel with ${n} slices${result ? `, landed on ${result}` : ''}`}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: conicBackground(n),
                border: '8px solid var(--panel-edge)',
                boxShadow: 'var(--shadow), inset 0 0 0 4px var(--surface-solid)',
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? 'transform 4s cubic-bezier(.17,.67,.12,1)'
                  : 'transform .4s ease-out',
                position: 'relative',
              }}
            >
              {/* Slice labels, each centred on its segment */}
              {slices.map((label, i) => {
                // Conic wedges are measured clockwise from the top (12 o'clock),
                // but CSS rotate() measures from the East (3 o'clock) axis — so a
                // label must be rotated `mid - 90` to sit on top of its own wedge.
                // (Without the -90 the label lands 90° off, making the pointer
                // appear to land on a different phrase than the result reports.)
                const mid = i * seg + seg / 2;
                return (
                  <div
                    key={`${label}-${i}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${mid - 90}deg) translate(8px, -0.7em)`,
                      width: '44%',
                      textAlign: 'right',
                      paddingRight: 10,
                      fontFamily: 'var(--orn-font)',
                      fontSize: n > 14 ? '.62em' : n > 9 ? '.72em' : '.84em',
                      fontWeight: 700,
                      color: '#f5f0ff',
                      textShadow: '0 1px 2px rgba(0,0,0,.55)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      pointerEvents: 'none',
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            {/* Hub */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 34,
                height: 34,
                marginTop: -17,
                marginLeft: -17,
                borderRadius: '50%',
                background: 'var(--surface-solid)',
                border: '4px solid var(--panel-edge)',
                zIndex: 2,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
            <button
              type="button"
              className="tbtn"
              onClick={handleSpin}
              disabled={spinning}
              style={{ fontSize: '1.1em', padding: '12px 28px' }}
            >
              {spinning ? 'spinning…' : result ? 'spin again ★' : 'spin the wheel ★'}
            </button>
          </div>

          {result && !spinning && (
            <div
              className="card"
              style={{ marginTop: 6, textAlign: 'center', animation: 'wof-pop .5s ease-out both' }}
            >
              <div className="note" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
                the wheel says
              </div>
              <h2 style={{ margin: '.15em 0', fontFamily: 'var(--orn-font)', fontSize: '1.6em' }}>
                {result}
              </h2>
            </div>
          )}
        </>
      )}
    </Win9xWindow>
  );
}
