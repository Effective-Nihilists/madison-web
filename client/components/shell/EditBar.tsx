import { useEffect, useState, type ReactElement } from 'react';
import { useSiteConfig } from './siteConfigContext';
import { useRouter } from '../../router';
import { ENTRY_CORNER_KEYS, ENTRY_CORNER_LABELS } from '../../../shared/entries';

// ─── Unified edit mode ──────────────────────────────────────────────────────
// One editing concept for the owner: by default the site is fully public (even
// to the admin). A small floating EditEntryButton turns on `editMode`; that
// raises the top EditBar, which links straight into the CMS (Articles, Comments,
// Media, Wheels, Galleries) and exposes the colors/fonts customizer. The same
// `editMode` flag still drives the in-place tools (Editable text, widget drag/
// resize) and the contextual EditLinks scattered across the live pages.
//
// Rendered globally in AppShell, so the bar persists across navigation — a
// single editing session on both live pages and full-page CMS managers — until
// "done". All of this renders nothing for non-admins.

const COLOR_VARS: { var: string; label: string }[] = [
  { var: '--bg', label: 'Background' },
  { var: '--bg2', label: 'Background 2' },
  { var: '--surface-solid', label: 'Panel' },
  { var: '--text', label: 'Text' },
  { var: '--text-soft', label: 'Soft text' },
  { var: '--accent', label: 'Accent' },
  { var: '--accent2', label: 'Accent 2' },
  { var: '--link', label: 'Links' },
  { var: '--gold', label: 'Gold' },
  { var: '--mr-red', label: 'Rainbow · red' },
  { var: '--mr-orange', label: 'Rainbow · orange' },
  { var: '--mr-yellow', label: 'Rainbow · yellow' },
  { var: '--mr-lime', label: 'Rainbow · lime' },
  { var: '--mr-green', label: 'Rainbow · green' },
  { var: '--mr-teal', label: 'Rainbow · teal' },
  { var: '--mr-cyan', label: 'Rainbow · cyan' },
  { var: '--mr-blue', label: 'Rainbow · blue' },
  { var: '--mr-indigo', label: 'Rainbow · indigo' },
  { var: '--mr-purple', label: 'Rainbow · purple' },
  { var: '--mr-magenta', label: 'Rainbow · magenta' },
  { var: '--mr-pink', label: 'Rainbow · pink' },
];

const FONT_VARS: { var: string; label: string }[] = [
  { var: '--display-font', label: 'Display' },
  { var: '--body-font', label: 'Body' },
  { var: '--orn-font', label: 'Ornament' },
  { var: '--pixel-font', label: 'Pixel' },
];

const FONT_CHOICES: { name: string; stack: string }[] = [
  { name: 'Bungee', stack: "'Bungee', cursive" },
  { name: 'Spectral', stack: "'Spectral', serif" },
  { name: 'Fraunces', stack: "'Fraunces', serif" },
  { name: 'Rubik Mono One', stack: "'Rubik Mono One', sans-serif" },
  { name: 'VT323', stack: "'VT323', monospace" },
  { name: 'Press Start 2P', stack: "'Press Start 2P', cursive" },
  { name: 'Orbitron', stack: "'Orbitron', sans-serif" },
  { name: 'Monoton', stack: "'Monoton', cursive" },
  { name: 'Lobster', stack: "'Lobster', cursive" },
  { name: 'Pacifico', stack: "'Pacifico', cursive" },
  { name: 'Creepster', stack: "'Creepster', cursive" },
  { name: 'Comic Neue', stack: "'Comic Neue', cursive" },
  { name: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace" },
  { name: 'Bricolage Grotesque', stack: "'Bricolage Grotesque', sans-serif" },
];

// Coerce any CSS color (hex / rgb / named) to #rrggbb so it fits an <input
// type=color>. Alpha is dropped. Falls back to #888888 if unparseable.
function toHex(color: string): string {
  if (typeof document === 'undefined') return '#888888';
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#888888';
  try {
    ctx.fillStyle = '#888888';
    ctx.fillStyle = color;
    const v = ctx.fillStyle;
    if (v.startsWith('#')) return v.slice(0, 7);
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v);
    if (m) {
      const h = (n: string): string => Number(n).toString(16).padStart(2, '0');
      return `#${h(m[1] ?? '0')}${h(m[2] ?? '0')}${h(m[3] ?? '0')}`;
    }
  } catch { /* ignore */ }
  return '#888888';
}

function currentValue(cssVar: string, override: string | undefined): string {
  if (override) return override;
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}

// The colors & fonts customizer, opened from the EditBar. Behavior is unchanged
// from the previous floating toolbar — it just lives behind the bar now.
function CustomizePanel({ onClose }: { onClose: () => void }): ReactElement {
  const { config, save } = useSiteConfig();

  function setColor(cssVar: string, hex: string): void {
    save({ theme: { ...config.theme, [cssVar]: hex } });
  }
  function setFont(cssVar: string, stack: string): void {
    save({ fonts: { ...config.fonts, [cssVar]: stack } });
  }
  function resetAll(): void {
    save({ theme: {}, fonts: {} });
  }

  return (
    <div className="edit-panel win">
      <div className="win-title">
        <span className="wt-label">customize.exe</span>
        <span className="win-btns"><b role="button" aria-label="close" onClick={onClose}>×</b></span>
      </div>
      <div className="win-body">
        <h4>Fonts</h4>
        {FONT_VARS.map((f) => (
          <label key={f.var} className="edit-row">
            <span>{f.label}</span>
            <select
              value={config.fonts[f.var] ?? ''}
              onChange={(e) => { setFont(f.var, e.target.value); }}
            >
              <option value="">(default)</option>
              {FONT_CHOICES.map((c) => (
                <option key={c.name} value={c.stack}>{c.name}</option>
              ))}
            </select>
          </label>
        ))}

        <h4 style={{ marginTop: 12 }}>Colors</h4>
        {COLOR_VARS.map((c) => (
          <label key={c.var} className="edit-row">
            <span>{c.label}</span>
            <input
              type="color"
              value={toHex(currentValue(c.var, config.theme[c.var]))}
              onChange={(e) => { setColor(c.var, e.target.value); }}
            />
          </label>
        ))}

        <button type="button" className="tbtn" style={{ marginTop: 12, width: '100%' }} onClick={resetAll}>
          ↺ reset colors & fonts
        </button>
        <p className="note" style={{ marginTop: 8 }}>
          changes save automatically and are visible to everyone. drag the sidebar
          corners and widget boxes to reorder; drag a box’s bottom edge to resize.
        </p>
      </div>
    </div>
  );
}

// Small floating entry point, admin-only, hidden while editing. Click to enter
// edit mode (which raises the EditBar).
export function EditEntryButton(): ReactElement | null {
  const { admin, editMode, setEditMode } = useSiteConfig();
  if (!admin || editMode) return null;
  return (
    <button
      type="button"
      className="edit-entry-btn"
      title="edit site"
      aria-label="edit site"
      onClick={() => { setEditMode(true); }}
    >
      ✎ edit
    </button>
  );
}

// The unified top edit bar. Persists across navigation while editMode is on.
export function EditBar(): ReactElement | null {
  const { admin, editMode, setEditMode } = useSiteConfig();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [galleriesOpen, setGalleriesOpen] = useState(false);

  // Offset the layout for the fixed bar via a body class (see madison.css).
  useEffect(() => {
    const on = admin && editMode;
    document.body.classList.toggle('is-editing', on);
    return () => { document.body.classList.remove('is-editing'); };
  }, [admin, editMode]);

  if (!admin || !editMode) return null;

  return (
    <>
      <div className="edit-bar" role="toolbar" aria-label="site editing">
        <span className="eb-label">EDITING</span>
        <nav className="eb-links">
          <button type="button" className="eb-link" onClick={() => { router.push('admin/articles', {}); }}>Articles</button>
          <button type="button" className="eb-link" onClick={() => { router.push('admin/comments', {}); }}>Comments</button>
          <button type="button" className="eb-link" onClick={() => { router.push('admin/media', {}); }}>Media &amp; Music</button>
          <button type="button" className="eb-link" onClick={() => { router.push('admin/wheels', {}); }}>Wheels</button>
          <span className="eb-dropdown">
            <button
              type="button"
              className="eb-link"
              aria-expanded={galleriesOpen}
              onClick={() => { setGalleriesOpen((o) => !o); }}
            >
              Galleries ▾
            </button>
            {galleriesOpen && (
              <span className="eb-menu">
                {ENTRY_CORNER_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="eb-menu-item"
                    onClick={() => { setGalleriesOpen(false); router.push('admin/entries/:corner', { corner: k }); }}
                  >
                    {ENTRY_CORNER_LABELS[k] ?? k}
                  </button>
                ))}
              </span>
            )}
          </span>
        </nav>
        <span className="eb-spacer" />
        <button
          type="button"
          className={`eb-link${panelOpen ? ' on' : ''}`}
          onClick={() => { setPanelOpen((o) => !o); }}
        >
          ✦ colors &amp; fonts
        </button>
        <button
          type="button"
          className="eb-done"
          onClick={() => { setEditMode(false); setPanelOpen(false); setGalleriesOpen(false); }}
        >
          ✓ done
        </button>
      </div>
      {panelOpen && <CustomizePanel onClose={() => { setPanelOpen(false); }} />}
    </>
  );
}
