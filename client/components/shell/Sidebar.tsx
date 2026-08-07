import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../../api';
import { CORNERS, type ButtonImage } from '../../../shared/blog';
import { Link } from '../../router';
import AnimateIn from '../AnimateIn';
import Editable from './Editable';
import { useSiteConfig, applyOrder } from './siteConfigContext';
import { useDragReorder } from './useDragReorder';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// The corners navigation, ported from the v3-01 mock. Each corner is an
// image-backed button: the thumbnail uses a CMS-managed buttonImage (keyed by
// corner key) when present, else a deterministic local gradient. Navigates via
// the typed <Link> to `corner/:corner`. Under 768px it becomes a slide-in
// drawer (open/close driven by AppShell's hamburger).
//
// In admin edit mode the corners become drag-to-reorder (persisted as
// cornerOrder) and their labels become inline-editable.

// The thumbnail fallback used to be `https://picsum.photos/seed/<key>/60/60`.
// All 15 corners render at once, so every page view fired 15 concurrent
// requests at a free placeholder service — errorLog filled with
// "[ugly.ux] image: failed to load ... the CSS background-image could not be
// fetched" for a dozen seeds in the same second. A production page should not
// depend on a placeholder host at all, so the fallback is now local: a
// deterministic gradient derived from the key, which needs no network, cannot
// rate-limit, and keeps the retro palette.

/** Stable 32-bit hash so a corner always gets the same colours. */
function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++)
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** A CSS `background-image` value — a gradient, not a `url()`. */
function fallbackThumb(key: string): string {
  const h = hashKey(key);
  const hue = h % 360;
  const hue2 = (hue + 40 + (h % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue} 62% 58%), hsl(${hue2} 58% 38%))`;
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): ReactElement {
  const [images, setImages] = useState<Record<string, string>>({});
  const { config, editMode, save } = useSiteConfig();

  useEffect(() => {
    let alive = true;
    void apiPost<{ images: ButtonImage[] }>('listButtonImages', {})
      .then((res) => {
        if (!alive) return;
        const map: Record<string, string> = {};
        for (const img of res.images) map[img.key] = img.url;
        setImages(map);
      })
      .catch(() => {
        /* fall back to the local gradient thumbs */
      });
    return () => {
      alive = false;
    };
  }, []);

  const orderedCorners = applyOrder(
    [...CORNERS],
    config.cornerOrder,
    (c) => c.key,
  );
  const { itemProps } = useDragReorder(
    orderedCorners.map((c) => c.key),
    (next) => {
      save({ cornerOrder: next });
    },
  );

  return (
    <aside className={`sidebar win${open ? ' open' : ''}`}>
      <div className="win-title">
        <span className="wt-label">corners.exe</span>
        <span className="win-btns">
          <b>_</b>
          <b role="button" aria-label="close" onClick={onClose} data-id="close">
            ×
          </b>
        </span>
      </div>
      <div className="sidebar-inner">
        <button
          className="icon-btn drawer-close"
          aria-label="close menu"
          onClick={onClose}
          data-id="close-menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
        <Editable as="h3" id="sidebar.heading">
          ~ THE CORNERS ~
        </Editable>
        <div>
          {orderedCorners.map((c) => (
            <AnimateIn key={c.key}>
              <Link
                to="corner/:corner"
                params={{ corner: c.key }}
                className={`corner${editMode ? ' editing' : ''}`}
                {...(editMode ? itemProps(c.key) : {})}
                onClick={(e) => {
                  if (editMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  onClose();
                }}
                data-id="link"
              >
                <span
                  className="thumb retrofx"
                  style={{
                    backgroundImage: images[c.key]
                      ? `url(${images[c.key]})`
                      : fallbackThumb(c.key),
                  }}
                />
                <Editable as="span" id={`corner.${c.key}`}>
                  {c.label}
                </Editable>
                <svg
                  className="pencil"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </aside>
  );
}
