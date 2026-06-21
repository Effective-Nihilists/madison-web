import { useEffect, useRef, type ReactElement } from 'react';

// ─── CursorRibbon ─────────────────────────────────────────────────────────────
// Ported "Reading-Rainbow" ribbon trail from the v3-01 mock. A canvas that
// follows the cursor with a smoothed, hue-cycling, fading ribbon. Skipped
// entirely on coarse pointers (touch) so phones don't lag. pointer-events:none
// + high z-index so it floats above content without intercepting clicks.

interface RibbonPoint {
  x: number;
  y: number;
  t: number;
  spark?: number;
}

export default function CursorRibbon(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Skip on touch / coarse pointers.
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    const bc = canvasRef.current;
    if (!bc) return;
    const ctx = bc.getContext('2d');
    if (!ctx) return;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    function sizeCanvas(): void {
      if (!bc || !ctx) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      bc.width = Math.floor(window.innerWidth * DPR);
      bc.height = Math.floor(window.innerHeight * DPR);
      bc.style.width = `${window.innerWidth}px`;
      bc.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    sizeCanvas();

    const LIFE = 1200; // ms a point survives -> slow tail fade
    const MAX_PTS = 220;
    let points: RibbonPoint[] = [];
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let have = false;
    let rafId = 0;

    function onMove(e: MouseEvent): void {
      mx = e.clientX; my = e.clientY; have = true;
      const jx = mx + (Math.random() * 1.6 - 0.8);
      const jy = my + (Math.random() * 1.6 - 0.8);
      const p: RibbonPoint = { x: jx, y: jy, t: performance.now() };
      if (Math.random() < 0.1) p.spark = 1;
      points.push(p);
      if (points.length > MAX_PTS) points.shift();
    }

    function frame(): void {
      if (!ctx) return;
      const now = performance.now();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      while (points.length && now - (points[0]?.t ?? now) > LIFE) points.shift();

      if (have) {
        const head = points[points.length - 1];
        if (head && now - head.t < 24) { head.x = mx; head.y = my; head.t = now; }
        else {
          points.push({ x: mx, y: my, t: now });
          if (points.length > MAX_PTS) points.shift();
        }
      }

      if (points.length >= 2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const n = points.length;
        const drift = now * 0.00006;
        for (let i = 1; i < n - 1; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const p2 = points[i + 1];
          if (!p0 || !p1 || !p2) continue;
          const frac = i / (n - 1);
          const age = (now - p1.t) / LIFE;
          const alpha = Math.max(0, 0.8 * (1 - age));
          if (alpha <= 0.01) continue;
          const width = 0.6 + frac * frac * 6.4;
          const hue = ((frac * 300) + drift * 360) % 360;
          const col = `hsl(${hue.toFixed(0)},95%,${(58 - frac * 8).toFixed(0)}%)`;
          const m1x = (p0.x + p1.x) / 2;
          const m1y = (p0.y + p1.y) / 2;
          const m2x = (p1.x + p2.x) / 2;
          const m2y = (p1.y + p2.y) / 2;
          ctx.beginPath();
          ctx.moveTo(m1x, m1y);
          ctx.quadraticCurveTo(p1.x, p1.y, m2x, m2y);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = col;
          ctx.lineWidth = width;
          ctx.shadowColor = col;
          ctx.shadowBlur = 8 + frac * 10;
          ctx.stroke();
          if (p1.spark && frac > 0.6) {
            ctx.beginPath();
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = col;
            ctx.arc(p1.x, p1.y, 0.8 + Math.random() * 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      }
      rafId = requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', sizeCanvas);
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', sizeCanvas);
      cancelAnimationFrame(rafId);
      points = [];
    };
  }, []);

  return <canvas className="beam-trail" ref={canvasRef} aria-hidden="true" />;
}
