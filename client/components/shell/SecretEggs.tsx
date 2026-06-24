import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { FractalHandle } from './FractalBackground';
import { useShell } from './shellContext';

// ─── SecretEggs ───────────────────────────────────────────────────────────────
// The five hidden eggs ported from the v3-01 mock:
//   1. secret dot in the wordmark  -> rain leaves + wild preset   (rainDoodles)
//   2. counter clicks              -> Cosmoo runs across          (runCosmoo)
//   3. brand triple-click / hold   -> the secret room             (openRoom)
//   4. hidden bottom-right corner  -> tilt the page               (toggleTilt)
//   5. KONAMI code                 -> chaos mode (shake + rain + boosted viz)
//
// AppShell holds the brand/dot/counter UI, so this component exposes an
// imperative handle for eggs (1)(2)(3), and self-wires (4) the corner hotspot
// and (5) the global Konami listener. It renders the secret-room overlay and
// the Cosmoo runner; falling doodles are appended to <body> directly.

export interface SecretEggsHandle {
  rainDoodles: (count: number) => void;
  runCosmoo: () => void;
  openRoom: () => void;
}

const GLYPHS = ['❋', '✦', '❀', '✿', '❉', '✧', '♣', '❦'];
const DOODLE_COLORS = ['#b5663b', '#5b6b3a', '#c79a3a', '#5a3a52', '#9a4a25'];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const SecretEggs = forwardRef<SecretEggsHandle, { milkdrop: RefObject<FractalHandle | null> }>(
  function SecretEggs({ milkdrop }, ref) {
    const { toast } = useShell();
    const [roomOpen, setRoomOpen] = useState(false);
    const cosmooRef = useRef<HTMLDivElement | null>(null);

    function secretFound(msg: string): void { toast(`✦ you found a secret! ${msg}`); }

    function rainDoodles(count: number): void {
      for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'doodle';
        s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '✦';
        s.style.left = `${Math.random() * 100}vw`;
        s.style.fontSize = `${12 + Math.random() * 22}px`;
        s.style.color = DOODLE_COLORS[Math.floor(Math.random() * DOODLE_COLORS.length)] ?? '#c79a3a';
        const dur = 3 + Math.random() * 3;
        s.style.animationDuration = `${dur}s`;
        document.body.appendChild(s);
        setTimeout(() => { s.remove(); }, dur * 1000 + 200);
      }
    }

    function runCosmoo(): void {
      const c = cosmooRef.current;
      if (!c) return;
      c.style.display = 'block';
      c.style.transition = 'none';
      c.style.left = '-220px';
      requestAnimationFrame(() => {
        c.style.transition = 'left 2.6s linear';
        c.style.left = '100vw';
      });
      setTimeout(() => { if (cosmooRef.current) cosmooRef.current.style.display = 'none'; }, 2700);
    }

    function openRoom(): void { setRoomOpen(true); secretFound('the secret room'); }

    useImperativeHandle(ref, (): SecretEggsHandle => ({
      rainDoodles: (count) => { rainDoodles(count); milkdrop.current?.loadRandomPreset(); secretFound('the autumn rains'); },
      runCosmoo: () => { runCosmoo(); secretFound('a passing cat'); },
      openRoom,
    }), []);

    // (4) hidden bottom-right corner -> tilt the page
    useEffect(() => {
      const hot = document.createElement('div');
      hot.style.cssText = 'position:fixed;right:0;bottom:0;width:34px;height:34px;z-index:50;cursor:crosshair';
      document.body.appendChild(hot);
      const onClick = (): void => {
        document.querySelector('.shell')?.classList.toggle('tilted');
        milkdrop.current?.loadRandomPreset();
        secretFound('the tilted timeline');
      };
      hot.addEventListener('click', onClick);
      return () => { hot.removeEventListener('click', onClick); hot.remove(); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // (5) KONAMI code -> chaos mode
    useEffect(() => {
      let pos = 0;
      function chaosMode(): void {
        secretFound('CHAOS MODE');
        milkdrop.current?.loadRandomPreset();
        const shell = document.querySelector('.shell');
        if (shell) {
          shell.classList.add('shaking');
          setTimeout(() => { shell.classList.remove('shaking'); }, 3000);
        }
        rainDoodles(40);
        milkdrop.current?.setOpacity(0.85);
        setTimeout(() => { milkdrop.current?.setOpacity(0.5); }, 5000);
      }
      function onKey(e: KeyboardEvent): void {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (k === KONAMI[pos]) { pos++; if (pos === KONAMI.length) { pos = 0; chaosMode(); } }
        else pos = (k === KONAMI[0]) ? 1 : 0;
      }
      window.addEventListener('keydown', onKey);
      return () => { window.removeEventListener('keydown', onKey); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <>
        <div
          className={`secret-room${roomOpen ? ' open' : ''}`}
          onClick={() => { setRoomOpen(false); }}
        >
          <div className="room" onClick={(e) => { e.stopPropagation(); }}>
            <h2>✦ THE SECRET ROOM ✦</h2>
            <p>you found the hidden door behind the wordmark. welcome, ghost. there is tea here, and the cat approves of you. tell no one. (click anywhere to leave)</p>
          </div>
        </div>
        <div className="cosmoo" ref={cosmooRef} style={{ display: 'none' }} aria-hidden="true">
          ≽^•⩊•^≼  Cosmoo, knight of the loaf, runs by!
        </div>
      </>
    );
  },
);

export default SecretEggs;
