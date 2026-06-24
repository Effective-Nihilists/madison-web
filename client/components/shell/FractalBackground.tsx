import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';

// ─── FractalBackground ────────────────────────────────────────────────────────
// A continuous generative fractal that cycles through several fractal TYPES
// (animated Mandelbrot, Julia, Burning Ship, and a kaleidoscopic IFS) and color
// palettes to keep the backdrop crazy. Rendered with a single fullscreen GLSL
// fragment shader via three.js (already a project dependency) — no runtime CDN
// dependency, unlike the previous Butterchurn visualizer.
//
// All WebGL work happens in a client-only useEffect, so it never runs during an
// SSR / Workers render. If WebGL is unavailable it falls back to the CSS
// gradient (.viz-fallback) and the static scrim.
//
// The imperative handle mirrors the small surface the rest of the shell calls:
//   loadRandomPreset() — jump to a random fractal type + palette (secret eggs)
//   setOpacity(v)      — 0..1 canvas opacity
//   resume()           — no-op (kept for the music player's optional call)
//   connectTrackAudio() — no-op (the fractal is not audio-reactive)

export interface FractalHandle {
  loadRandomPreset: () => void;
  setOpacity: (v: number) => void;
  resume: () => void;
  connectTrackAudio: (el: HTMLMediaElement) => void;
}

const NUM_TYPES = 4;
const NUM_PALETTES = 5;

const VERT = `
  void main() {
    // position is the 2x2 plane; use its xy directly as clip-space coords.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform int uType;
  uniform int uPalette;
  uniform float uSpeed;

  // Inigo Quilez cosine palette, with a few coefficient sets per uPalette.
  vec3 palette(float t, int p) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    if (p == 1) { d = vec3(0.0, 0.10, 0.20); }
    else if (p == 2) { a = vec3(0.5,0.4,0.4); c = vec3(1.0,1.0,1.0); d = vec3(0.0,0.15,0.30); }
    else if (p == 3) { a = vec3(0.8,0.5,0.4); b = vec3(0.2,0.4,0.2); c = vec3(2.0,1.0,1.0); d = vec3(0.0,0.25,0.25); }
    else if (p == 4) { c = vec3(1.0,1.0,0.5); d = vec3(0.80,0.90,0.30); }
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
    float t = uTime * uSpeed;
    vec3 col;

    if (uType == 3) {
      // Kaleidoscopic IFS fold — pure chaos, no escape-time.
      vec2 p = uv * 1.5;
      float glow = 0.0;
      for (int i = 0; i < 14; i++) {
        p = abs(p) / dot(p, p) - vec2(0.7 + 0.18 * sin(t * 0.30), 0.9 + 0.18 * cos(t * 0.21));
        glow += exp(-length(p) * 1.4);
      }
      col = palette(glow * 0.14 + t * 0.05, uPalette);
    } else {
      vec2 z;
      vec2 c;
      if (uType == 0) {
        // Mandelbrot, gently oscillating zoom around a seahorse valley.
        float zo = 0.7 + 0.9 * (0.5 + 0.5 * sin(t * 0.06));
        c = vec2(-0.743643887, 0.131825904) + uv * zo;
        z = vec2(0.0);
      } else if (uType == 1) {
        // Burning Ship.
        float zo = 0.5 + 0.5 * (0.5 + 0.5 * sin(t * 0.05));
        c = vec2(-1.762, -0.028) + uv * zo;
        z = vec2(0.0);
      } else {
        // Julia, c orbiting a circle.
        c = 0.7885 * vec2(cos(t * 0.12), sin(t * 0.12));
        z = uv * 1.4;
      }

      float sm = 0.0;
      bool escaped = false;
      for (int k = 0; k < 140; k++) {
        if (uType == 1) { z = abs(z); }
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        float d2 = dot(z, z);
        if (d2 > 256.0) {
          sm = float(k) - log2(log2(d2)) + 4.0;
          escaped = true;
          break;
        }
      }
      col = escaped ? palette(sm * 0.02 + t * 0.04, uPalette) : vec3(0.02, 0.01, 0.04);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const FractalBackground = forwardRef<FractalHandle, { cycleSeconds?: number; speed?: number }>(
  function FractalBackground({ cycleSeconds = 16, speed = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fallbackRef = useRef<HTMLDivElement | null>(null);
    const uniformsRef = useRef<{
      uRes: { value: THREE.Vector2 };
      uTime: { value: number };
      uType: { value: number };
      uPalette: { value: number };
      uSpeed: { value: number };
    } | null>(null);

    function randomize(): void {
      const u = uniformsRef.current;
      if (!u) return;
      u.uType.value = Math.floor(Math.random() * NUM_TYPES);
      u.uPalette.value = Math.floor(Math.random() * NUM_PALETTES);
    }

    useImperativeHandle(ref, (): FractalHandle => ({
      loadRandomPreset: randomize,
      setOpacity: (v: number) => {
        const c = canvasRef.current;
        if (c) c.style.opacity = String(v);
      },
      resume: () => { /* no-op: fractal needs no audio context */ },
      connectTrackAudio: () => { /* no-op: not audio-reactive */ },
    }), []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const reduced = prefersReducedMotion();
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
      } catch {
        if (fallbackRef.current) fallbackRef.current.style.display = 'block';
        canvas.style.display = 'none';
        return;
      }
      renderer.setPixelRatio(1);
      renderer.setSize(window.innerWidth, window.innerHeight, false);

      const uniforms = {
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTime: { value: 0 },
        uType: { value: Math.floor(Math.random() * NUM_TYPES) },
        uPalette: { value: Math.floor(Math.random() * NUM_PALETTES) },
        uSpeed: { value: speed },
      };
      uniformsRef.current = uniforms;

      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      function onResize(): void {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      }
      window.addEventListener('resize', onResize);

      // Cycle fractal type + palette periodically to "keep it crazy".
      const cycleId = reduced ? null : window.setInterval(randomize, Math.max(4, cycleSeconds) * 1000);

      let raf = 0;
      const start = performance.now();
      const loop = (): void => {
        uniforms.uTime.value = reduced ? 8 : (performance.now() - start) / 1000;
        try { renderer.render(scene, camera); } catch { /* ignore */ }
        if (!reduced) raf = requestAnimationFrame(loop);
      };
      loop();

      return () => {
        window.removeEventListener('resize', onResize);
        if (cycleId !== null) window.clearInterval(cycleId);
        if (raf) cancelAnimationFrame(raf);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        uniformsRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cycleSeconds, speed]);

    return (
      <>
        <canvas className="viz-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="viz-fallback" ref={fallbackRef} style={{ display: 'none' }} aria-hidden="true" />
        <div className="viz-scrim" aria-hidden="true" />
      </>
    );
  },
);

export default FractalBackground;
