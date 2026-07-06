import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';
import { CORNERS, type Article } from '../../../shared/blog';

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

// One Win9x-framed link tile in the hub grid.
function HubTile({
  to,
  params,
  glyph,
  title,
  blurb,
}: {
  to: Parameters<typeof Link>[0]['to'];
  params: Record<string, string>;
  glyph: string;
  title: string;
  blurb: string;
}): ReactElement {
  return (
    <Win9xWindow
      title={`${title.toLowerCase().replace(/\s+/g, '-')}.lnk`}
      className="hub-tile"
      bodyClassName="doc-body"
    >
      <Link
        to={to}
        params={params}
        className="card"
        style={{
          display: 'block',
          marginBottom: 0,
          textDecoration: 'none',
          border: 0,
          background: 'transparent',
          padding: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden
            style={{ fontSize: '1.8em', lineHeight: 1, fontFamily: 'var(--orn-font)' }}
          >
            {glyph}
          </span>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--orn-font)' }}>{title}</h2>
            <p className="note" style={{ margin: '.2em 0 0' }}>
              {blurb}
            </p>
          </div>
        </div>
      </Link>
    </Win9xWindow>
  );
}

// HealthPage — the Health Corner HUB. Replaces the plain article-list for
// `corner/health`. Intro + framed links to Guided Breathing, the Med Plants
// guide, and the Health essays (articles in the 'health' corner).
export default function HealthPage(): ReactElement {
  const label = CORNERS.find((c) => c.key === 'health')?.label ?? 'Health Corner';
  const [essays, setEssays] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const { articles } = await apiPost<{ articles: Article[] }>('listArticles', {
          corner: 'health',
        });
        if (!active) return;
        setEssays(
          articles
            .filter((a) => a.status === 'published')
            .sort((x, y) => toMs(y.created) - toMs(x.created)),
        );
      } finally {
        if (active) setLoaded(true);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Win9xWindow title="health.dir — Explorer" className="article-win" bodyClassName="doc-body">
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        › {label}
      </div>

      <h1 className="article" style={{ textAlign: 'center' }}>
        <span aria-hidden>❀ ✦ ❀</span> {label} <span aria-hidden>❀ ✦ ❀</span>
      </h1>
      <p className="note" style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto 8px' }}>
        Breathe, rest, and tend to yourself. A quiet corner for calm — for
        wonder and care, never prescription. ❀
      </p>

      <div
        className="highlight-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
          marginTop: 16,
        }}
      >
        <HubTile
          to="health/breathing"
          params={{}}
          glyph="❀"
          title="Guided Breathing"
          blurb="A calming animated visual to pace your breath."
        />
        <HubTile
          to="health/plants"
          params={{}}
          glyph="✿"
          title="Med Plants"
          blurb="A guide to medicinal plants — uses, preparation & cautions."
        />
      </div>

      {/* ── Health essays = health articles ──────────────────────────────────── */}
      <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 28 }}>
        <span aria-hidden>✶</span> Essays &amp; Notes
      </h2>
      {!loaded && <p className="note">loading…</p>}
      {loaded && essays.length === 0 && (
        <p className="note">no essays written yet — check back soon.</p>
      )}
      {essays.length > 0 && (
        <div
          className="highlight-grid"
          style={{ gridTemplateColumns: '1fr', gap: 12, marginTop: 8 }}
        >
          {essays.map((a) => (
            <Link
              key={a._id}
              to="article/:slug"
              params={{ slug: a.slug }}
              className="card"
              style={{ display: 'block', marginBottom: 0, textDecoration: 'none' }}
            >
              <h3 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>{a.title}</h3>
              {a.excerpt && <p style={{ margin: '.4em 0 0' }}>{a.excerpt}</p>}
              <div className="time" style={{ marginTop: 8 }}>
                {new Date(toMs(a.created)).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Win9xWindow>
  );
}
