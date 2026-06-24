import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { apiPost } from '../../api';
import { SiteConfigSchema, type SiteConfigData } from '../../../shared/site';

// ─── SiteConfigData context ───────────────────────────────────────────────────────
// Loads the global, admin-authored customization (colors, fonts, text overrides,
// layout order/size) once at boot, applies the theme to <html>, and exposes a
// `save(patch)` that persists + optimistically updates. Also owns admin status
// (whoAmI) and the session-only edit-mode toggle so the whole shell can react.

const DEFAULT_CONFIG: SiteConfigData = SiteConfigSchema.parse({});

interface SiteConfigCtx {
  config: SiteConfigData;
  admin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  save: (patch: Partial<SiteConfigData>) => void;
  /** Effective text for an id (override or fallback). */
  text: (id: string, fallback: string) => string;
  /** Set/clear a single text override (persists). */
  setText: (id: string, value: string, fallback: string) => void;
}

const Ctx = createContext<SiteConfigCtx | null>(null);

// Google Fonts loaded on demand for the font picker / saved fonts.
function ensureFontLoaded(family: string): void {
  if (typeof document === 'undefined' || !family) return;
  const id = `gf-${family.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export function SiteConfigProvider({ children }: { children: ReactNode }): ReactElement {
  const [config, setConfig] = useState<SiteConfigData>(DEFAULT_CONFIG);
  const [admin, setAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const pending = useRef<Partial<SiteConfigData>>({});
  const appliedRef = useRef<Set<string>>(new Set());

  // Load config + admin status once.
  useEffect(() => {
    let alive = true;
    void apiPost<{ config: SiteConfigData }>('getSiteConfig', {})
      .then((res) => { if (alive) setConfig(SiteConfigSchema.parse(res.config)); })
      .catch(() => { /* defaults */ });
    void apiPost<{ admin: boolean }>('whoAmI', {})
      .then((res) => { if (alive) setAdmin(res.admin); })
      .catch(() => { /* logged out → not admin */ });
    return () => { alive = false; };
  }, []);

  // Apply theme (CSS custom properties) + fonts to <html> whenever they change.
  // Stale vars (e.g. after a reset) are removed so defaults from madison.css
  // take over again.
  useEffect(() => {
    const root = document.documentElement;
    const nextKeys = new Set<string>();
    for (const [k, v] of Object.entries(config.theme)) { root.style.setProperty(k, v); nextKeys.add(k); }
    for (const [k, v] of Object.entries(config.fonts)) {
      const family = v.split(',')[0]?.trim().replace(/['"]/g, '') ?? '';
      ensureFontLoaded(family);
      root.style.setProperty(k, v);
      nextKeys.add(k);
    }
    for (const k of appliedRef.current) if (!nextKeys.has(k)) root.style.removeProperty(k);
    appliedRef.current = nextKeys;
  }, [config.theme, config.fonts]);

  // Debounced persistence — coalesces rapid edits (color slider drags) into one
  // write while optimistically reflecting changes locally.
  const save = useCallback((patch: Partial<SiteConfigData>) => {
    setConfig((prev) => SiteConfigSchema.parse({ ...prev, ...patch }));
    pending.current = { ...pending.current, ...patch };
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const patchToSend = pending.current;
      pending.current = {};
      void apiPost('saveSiteConfig', { patch: patchToSend }).catch(() => { /* surfaced elsewhere */ });
    }, 500);
  }, []);

  const text = useCallback(
    (id: string, fallback: string) => config.textOverrides[id] ?? fallback,
    [config.textOverrides],
  );

  const setText = useCallback((id: string, value: string, fallback: string) => {
    setConfig((prev) => {
      const trimmed = value.trim();
      let next: Record<string, string>;
      if (!trimmed || trimmed === fallback) {
        const { [id]: _drop, ...rest } = prev.textOverrides;
        next = rest;
      } else {
        next = { ...prev.textOverrides, [id]: value };
      }
      const merged = SiteConfigSchema.parse({ ...prev, textOverrides: next });
      // Persist the whole textOverrides map (server merges shallow by key).
      pending.current = { ...pending.current, textOverrides: merged.textOverrides };
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const patchToSend = pending.current;
        pending.current = {};
        void apiPost('saveSiteConfig', { patch: patchToSend }).catch(() => { /* ignore */ });
      }, 500);
      return merged;
    });
  }, []);

  const value = useMemo<SiteConfigCtx>(
    () => ({ config, admin, editMode, setEditMode, save, text, setText }),
    [config, admin, editMode, save, text, setText],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteConfig(): SiteConfigCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSiteConfig must be used within SiteConfigProvider');
  return ctx;
}

// Apply a saved order to a base list, appending any items not in the order
// (e.g. newly added corners) in their original position.
export function applyOrder<T>(items: T[], order: string[], keyOf: (t: T) => string): T[] {
  if (order.length === 0) return items;
  const byKey = new Map(items.map((i) => [keyOf(i), i] as const));
  const ordered = order.map((k) => byKey.get(k)).filter((x): x is T => x !== undefined);
  const remaining = items.filter((i) => !order.includes(keyOf(i)));
  return [...ordered, ...remaining];
}
