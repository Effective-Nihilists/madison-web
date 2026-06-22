import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../api';
import Win9xWindow from '../components/Win9xWindow';
import Markdown from '../components/Markdown';
import { Link } from '../router';
import { CORNERS } from '../../shared/blog';
import { CORNER_CONFIG, type CornerConfig, type Entry } from '../../shared/entries';

// Render up to 5 muted-rainbow stars for a 0–5 rating (decorative ★ allowed).
function Stars({ rating }: { rating: number }): ReactElement {
  const full = Math.round(rating);
  return (
    <span className="note" aria-label={`${rating} of 5`} style={{ letterSpacing: 1 }}>
      {'★'.repeat(full)}
      <span style={{ opacity: 0.3 }}>{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

// A small pill for status (reading-progress / been-wishlist etc.).
function StatusPill({ status }: { status: string }): ReactElement {
  return (
    <span
      className="note"
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 999,
        border: '2px solid var(--panel-edge)',
        background: 'var(--surface-solid)',
        fontSize: '.8em',
        textTransform: 'uppercase',
        letterSpacing: '.05em',
      }}
    >
      {status}
    </span>
  );
}

function ExternalLink({ href }: { href: string }): ReactElement {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="tbtn" style={{ marginTop: 8, display: 'inline-block' }}>
      visit ↗
    </a>
  );
}

// One image-forward tile for the gallery layout.
function GalleryTile({ entry }: { entry: Entry }): ReactElement {
  return (
    <figure className="card" style={{ margin: 0, padding: 8, overflow: 'hidden' }}>
      {entry.imageUrl ? (
        <img
          src={entry.imageUrl}
          alt={entry.title}
          loading="lazy"
          style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, display: 'block', border: '2px solid var(--panel-edge)' }}
        />
      ) : (
        <div
          style={{ width: '100%', height: 180, borderRadius: 8, border: '2px dashed var(--panel-edge)', display: 'grid', placeItems: 'center' }}
          className="note"
        >
          no image
        </div>
      )}
      <figcaption style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 700, fontFamily: 'var(--orn-font)' }}>{entry.title}</div>
        {entry.funFact && <div className="note" style={{ marginTop: 4 }}>{entry.funFact}</div>}
        {entry.tags.length > 0 && (
          <div className="note" style={{ marginTop: 4 }}>
            {entry.tags.map((t) => `#${t}`).join(' ')}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

// One framed card for the cards layout (books/movies/restaurants/travel).
function EntryCard({ entry }: { entry: Entry }): ReactElement {
  return (
    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 0 }}>
      {entry.imageUrl && (
        <img
          src={entry.imageUrl}
          alt={entry.title}
          loading="lazy"
          style={{ width: 96, height: 128, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--panel-edge)', flex: '0 0 auto' }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>{entry.title}</h2>
          {entry.status && <StatusPill status={entry.status} />}
        </div>
        {entry.rating !== null && <div style={{ margin: '4px 0' }}><Stars rating={entry.rating} /></div>}
        {entry.body && <Markdown source={entry.body} />}
        {entry.link && <ExternalLink href={entry.link} />}
      </div>
    </div>
  );
}

// One stacked row for the list layout (recipes — markdown ingredients/steps).
function EntryRow({ entry }: { entry: Entry }): ReactElement {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)', flex: 1 }}>{entry.title}</h2>
        {entry.link && <ExternalLink href={entry.link} />}
      </div>
      {entry.tags.length > 0 && (
        <div className="note" style={{ marginTop: 4 }}>{entry.tags.map((t) => `#${t}`).join(' ')}</div>
      )}
      {entry.imageUrl && (
        <img
          src={entry.imageUrl}
          alt={entry.title}
          loading="lazy"
          style={{ width: '100%', maxWidth: 360, borderRadius: 8, border: '2px solid var(--panel-edge)', margin: '8px 0' }}
        />
      )}
      {entry.body && <Markdown source={entry.body} />}
    </div>
  );
}

// GalleryPage — generic per-corner renderer driven by CORNER_CONFIG. Used for
// the 8 entry corners (books, movies, recipes, restaurants, travel, vision,
// memes, animals). Fetches over same-origin HTTP so it works logged-out.
export default function GalleryPage({ corner, config }: { corner: string; config: CornerConfig }): ReactElement {
  const label = CORNERS.find((c) => c.key === corner)?.label ?? corner;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 250);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void (async () => {
      try {
        const input: { corner: string; q?: string } = { corner };
        if (config.search && debouncedQ.trim()) input.q = debouncedQ.trim();
        const { entries: list } = await apiPost<{ entries: Entry[] }>('listEntries', input);
        if (active) setEntries(list);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [corner, config.search, debouncedQ]);

  const isGalleryGrid = config.layout === 'gallery';

  return (
    <Win9xWindow title={`${corner}.dir — Explorer`} className="article-win" bodyClassName="doc-body">
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        › {label}
      </div>
      <h1 className="article">{label}</h1>

      {config.search && (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search…"
          style={{ width: '100%', maxWidth: 360, margin: '8px 0' }}
        />
      )}

      {!loaded && <p className="note">loading…</p>}
      {loaded && entries.length === 0 && <p className="note">{config.emptyText}</p>}

      {entries.length > 0 && (
        <div
          className="highlight-grid"
          style={
            isGalleryGrid
              ? { gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 12 }
              : { gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }
          }
        >
          {entries.map((e) =>
            config.layout === 'gallery' ? (
              <GalleryTile key={e._id} entry={e} />
            ) : config.layout === 'list' ? (
              <EntryRow key={e._id} entry={e} />
            ) : (
              <EntryCard key={e._id} entry={e} />
            ),
          )}
        </div>
      )}
    </Win9xWindow>
  );
}

// Tiny debounce hook — avoids a request per keystroke for searchable corners.
function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// Re-export config lookup for CornerPage's dispatcher convenience.
export { CORNER_CONFIG };
