import {
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ThemeProvider, useTheme } from '../../theme';
import { Link } from '../../router';
import FractalBackground, { type FractalHandle } from './FractalBackground';
import CursorRibbon from './CursorRibbon';
import Scanlines from './Scanlines';
import MusicPlayer from './MusicPlayer';
import Sidebar from './Sidebar';
import WidgetRail from './WidgetRail';
import SecretEggs, { type SecretEggsHandle } from './SecretEggs';
import { ShellProvider } from './shellContext';
import { SiteConfigProvider, useSiteConfig } from './siteConfigContext';
import EditModeBar from './EditModeBar';

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Composition root for the 317010.xyz retro shell. Wraps every routed page in:
//   ThemeProvider + ShellProvider
//   fixed FX layers  (Milkdrop bg, scanlines, ribbon, music player)
//   a sticky top bar (brand, theme toggle, CRT toggle, hamburger)
//   the corners Sidebar (drawer under 768px)
//   a readable "document window" content column  ({children})
//   the WidgetRail and SecretEggs
//
// The Milkdrop/eggs imperative handles are shared so the player can drive the
// viz and the brand/dot/counter can trigger eggs.

// SVG retro filters (posterize) referenced by `.retrofx` thumbnails.
function RetroFilters(): ReactElement {
  return (
    <svg width={0} height={0} style={{ position: 'fixed', pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <filter id="posterize">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
            <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
            <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

function ThemeToggle(): ReactElement {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button className="icon-btn" aria-label="theme" onClick={toggleTheme}>
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      )}
    </button>
  );
}

function ShellInner({ children }: { children: ReactNode }): ReactElement {
  const fractal = useRef<FractalHandle | null>(null);
  const eggs = useRef<SecretEggsHandle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [crt, setCrt] = useState(true);
  const { config } = useSiteConfig();

  // brand triple-click / long-press -> secret room
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onBrandClick(): void {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 600);
    if (clickCount.current >= 3) { clickCount.current = 0; eggs.current?.openRoom(); }
  }
  function onBrandPressStart(): void {
    pressTimer.current = setTimeout(() => { eggs.current?.openRoom(); }, 650);
  }
  function onBrandPressEnd(): void {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  return (
    <>
      <RetroFilters />

      {/* fixed FX layers (low z-index fractal bg, high z-index ribbon) */}
      <FractalBackground ref={fractal} cycleSeconds={config.background.cycleSeconds} speed={config.background.speed} />
      <div className="star-field" aria-hidden="true" />
      <Scanlines enabled={crt} />
      <CursorRibbon />

      <div className="shell">
        {/* TOP BAR */}
        <div className="topbar">
          <button className="icon-btn hamburger" aria-label="menu" onClick={() => { setDrawerOpen(true); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <Link
            to=""
            params={{}}
            className="brand-mini mr-cycle"
            onClick={onBrandClick}
          >
            <span
              onPointerDown={onBrandPressStart}
              onPointerUp={onBrandPressEnd}
              onPointerLeave={onBrandPressEnd}
            >
              317010.xyz
            </span>
          </Link>
          <span className="spacer" />
          <button
            className="icon-btn desk-only"
            title="toggle CRT / scanlines"
            aria-label="toggle scanlines"
            onClick={() => { setCrt((c) => !c); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </button>
          <ThemeToggle />
        </div>

        <div className="layout">
          <Sidebar open={drawerOpen} onClose={() => { setDrawerOpen(false); }} />

          <main className="content">
            {children}
          </main>

          <WidgetRail onCounterClick={() => { eggs.current?.runCosmoo(); }} />
        </div>
      </div>

      {/* mobile drawer overlay */}
      <div
        className={`drawer-overlay${drawerOpen ? ' show' : ''}`}
        onClick={() => { setDrawerOpen(false); }}
        aria-hidden="true"
      />

      {/* floating music player */}
      <MusicPlayer milkdrop={fractal} />

      {/* the five secret eggs */}
      <SecretEggs ref={eggs} milkdrop={fractal} />

      {/* admin-only customizer (edit mode + colors/fonts) */}
      <EditModeBar />
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <SiteConfigProvider>
        <ShellProvider>
          <ShellInner>{children}</ShellInner>
        </ShellProvider>
      </SiteConfigProvider>
    </ThemeProvider>
  );
}
