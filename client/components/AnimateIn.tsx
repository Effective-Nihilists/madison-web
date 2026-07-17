import {
  cloneElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';

// ─── AnimateIn ────────────────────────────────────────────────────────────────
// Wraps a single element and makes it animate in with a RANDOM animation and a
// RANDOM stagger delay, so the home screen assembles itself chaotically on each
// load. To avoid adding wrapper DOM (which would break the grid/flex layouts)
// the animation is injected into the child's own `style` via cloneElement.
//
// After the animation finishes the injected style is cleared so the element
// returns to its base styling — important so hover transitions and edit-mode
// drag/resize transforms aren't pinned by the animation's fill-mode.

const ANIMATIONS = [
  'ani-fly-left',
  'ani-fly-right',
  'ani-fly-up',
  'ani-drop',
  'ani-zoom',
  'ani-spin-in',
  'ani-flip',
  'ani-bounce',
  'ani-glitch',
  'ani-pop',
] as const;

// Sequential counter so adjacent elements tend to get different animations
// instead of clustering on one. Combined with a random delay for variety.
let seq = 0;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function AnimateIn({
  children,
  maxDelayMs = 850,
}: {
  children: ReactElement<{ style?: CSSProperties }>;
  /** Upper bound for the random entrance delay. */
  maxDelayMs?: number;
}): ReactElement {
  const [anim] = useState(() => {
    if (prefersReducedMotion()) return null;
    const name = ANIMATIONS[seq++ % ANIMATIONS.length] ?? ANIMATIONS[0];
    const delay = Math.round(Math.random() * maxDelayMs);
    const duration = 520 + Math.round(Math.random() * 320); // 520–840ms
    return { name, delay, duration };
  });
  const [done, setDone] = useState(anim === null);

  useEffect(() => {
    if (!anim) return;
    const t = window.setTimeout(
      () => {
        setDone(true);
      },
      anim.delay + anim.duration + 60,
    );
    return () => {
      window.clearTimeout(t);
    };
  }, [anim]);

  const injected: CSSProperties =
    done || !anim
      ? {}
      : {
          animationName: anim.name,
          animationDuration: `${anim.duration}ms`,
          animationDelay: `${anim.delay}ms`,
          animationTimingFunction: 'cubic-bezier(.18,.7,.24,1.1)',
          animationFillMode: 'both',
          // willChange hints the compositor; cleared with the rest when done.
          willChange: 'transform, opacity',
        };

  return cloneElement(children, {
    style: { ...children.props.style, ...injected },
  });
}
