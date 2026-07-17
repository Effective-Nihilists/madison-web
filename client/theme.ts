import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

// ─── Theme ──────────────────────────────────────────────────────────────────
// Light = medieval book, Dark = techy space. Persisted in localStorage under
// 'madison-theme' and reflected onto document.documentElement.dataset.theme so
// the ported madison.css `html[data-theme="…"]` rules switch instantly.
export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'madison-theme';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage may be unavailable (private mode / SSR) — fall through.
  }
  return 'light';
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [theme, setThemeState] = useState<ThemeName>(() => readStoredTheme());

  // Reflect the active theme onto the document + persist it.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
  }, []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
