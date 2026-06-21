import { useEffect, useState, type ReactElement } from 'react';
import { useApp } from 'ugly-app/client';
import { CORNERS, type ButtonImage } from '../../../shared/blog';
import { Link } from '../../router';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// The corners navigation, ported from the v3-01 mock. Each corner is an
// image-backed button: the thumbnail uses a CMS-managed buttonImage (keyed by
// corner key) when present, else a deterministic picsum fallback. Navigates via
// the typed <Link> to `corner/:corner`. Under 768px it becomes a slide-in
// drawer (open/close driven by AppShell's hamburger).

function picsumFor(key: string): string {
  return `https://picsum.photos/seed/${key}/60/60`;
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactElement {
  const { socket } = useApp();
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    void socket.request('listButtonImages', {}).then((res) => {
      if (!alive) return;
      const { images: loaded } = res as { images: ButtonImage[] };
      const map: Record<string, string> = {};
      for (const img of loaded) map[img.key] = img.url;
      setImages(map);
    }).catch(() => { /* fall back to picsum */ });
    return () => { alive = false; };
  }, [socket]);

  return (
    <aside className={`sidebar win${open ? ' open' : ''}`}>
      <div className="win-title">
        <span className="wt-label">corners.exe</span>
        <span className="win-btns">
          <b>_</b>
          <b role="button" aria-label="close" onClick={onClose}>×</b>
        </span>
      </div>
      <div className="sidebar-inner">
        <button className="icon-btn drawer-close" aria-label="close menu" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <h3>~ THE CORNERS ~</h3>
        <div>
          {CORNERS.map((c) => (
            <Link
              key={c.key}
              to="corner/:corner"
              params={{ corner: c.key }}
              className="corner"
              onClick={onClose}
            >
              <span
                className="thumb retrofx"
                style={{ backgroundImage: `url(${images[c.key] ?? picsumFor(c.key)})` }}
              />
              <span>{c.label}</span>
              <svg className="pencil" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
