import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

// ─── Shell context ────────────────────────────────────────────────────────────
// Small app-shell context shared by the music player, widget rail and secret
// eggs: the current "now playing" string (drives the status widget) and a
// `toast` emitter kept as a no-op. The bottom-center toast pill was removed at
// the owner's request, so toast() now does nothing — call-sites are untouched.

interface NowPlaying {
  title: string;
  playing: boolean;
}

interface ShellContextValue {
  nowPlaying: NowPlaying;
  setNowPlaying: (n: NowPlaying) => void;
  toast: (msg: string) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }): ReactElement {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({ title: '— silence —', playing: false });

  // No-op: the bottom-center toast pill was removed. Kept so the music player,
  // widget rail, etc. can keep calling toast() without changes.
  const toast = useCallback((_msg: string) => { /* toast pill removed */ }, []);

  const value = useMemo<ShellContextValue>(
    () => ({ nowPlaying, setNowPlaying, toast }),
    [nowPlaying, toast],
  );

  return (
    <ShellContext.Provider value={value}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within a <ShellProvider>');
  return ctx;
}
