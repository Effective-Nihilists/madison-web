import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

// ─── Shell context ────────────────────────────────────────────────────────────
// Small app-shell context shared by the music player, widget rail and secret
// eggs: the current "now playing" string (drives the status widget) and a
// lightweight toast emitter (the mock's bottom toast).

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
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setToastShow(false); }, 2600);
  }, []);

  const value = useMemo<ShellContextValue>(
    () => ({ nowPlaying, setNowPlaying, toast }),
    [nowPlaying, toast],
  );

  return (
    <ShellContext.Provider value={value}>
      {children}
      <div className={`toast${toastShow ? ' show' : ''}`} aria-live="polite">{toastMsg}</div>
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within a <ShellProvider>');
  return ctx;
}
