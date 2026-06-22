import { useEffect, useState, type ReactElement } from 'react';
import { apiPost } from '../../api';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';
import { CORNERS, type Article } from '../../../shared/blog';

function toMs(d: number | Date): number {
  return d instanceof Date ? d.getTime() : d;
}

// One ornate Win9x-framed link tile in the hub grid.
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
    <Win9xWindow title={`${title.toLowerCase()}.spell`} className="hub-tile" bodyClassName="doc-body">
      <Link
        to={to}
        params={params}
        className="card"
        style={{ display: 'block', marginBottom: 0, textDecoration: 'none', border: 0, background: 'transparent', padding: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden style={{ fontSize: '1.8em', lineHeight: 1, fontFamily: 'var(--orn-font)' }}>
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

// WitchcraftPage — the Witchcraft Corner HUB. Replaces the plain article-list
// for `corner/witchcraft`. Ornate intro + framed links to the Tarot Guide,
// Digital Oracle, My Decks, Herbs Guide, and Spells (the witchcraft essays).
export default function WitchcraftPage(): ReactElement {
  const label = CORNERS.find((c) => c.key === 'witchcraft')?.label ?? 'Witchcraft Corner';
  const [spells, setSpells] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { articles } = await apiPost<{ articles: Article[] }>('listArticles', {
          corner: 'witchcraft',
        });
        if (!active) return;
        setSpells(
          articles
            .filter((a) => a.status === 'published')
            .sort((x, y) => toMs(y.created) - toMs(x.created)),
        );
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Win9xWindow title="witchcraft.dir — Explorer" className="article-win" bodyClassName="doc-body">
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        › {label}
      </div>

      <h1 className="article" style={{ textAlign: 'center' }}>
        <span aria-hidden>☽ ✦ ☆</span> {label} <span aria-hidden>☆ ✦ ☽</span>
      </h1>
      <p className="note" style={{ textAlign: 'center', maxWidth: 540, margin: '0 auto 8px' }}>
        Welcome, seeker. Draw the cards, brew the herbs, and wander the moonlit shelves.
        Everything here is for wonder, not prescription. ✧
      </p>

      <div
        className="highlight-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginTop: 16 }}
      >
        <HubTile
          to="witchcraft/tarot"
          params={{}}
          glyph="✦"
          title="Tarot Guide"
          blurb="All 78 cards — meanings, keywords, upright & reversed."
        />
        <HubTile
          to="witchcraft/oracle"
          params={{}}
          glyph="☽"
          title="Digital Oracle"
          blurb="Draw a card or a three-card spread for a reading."
        />
        <HubTile
          to="witchcraft/decks"
          params={{}}
          glyph="❖"
          title="My Decks"
          blurb="The deck collection — art, themes and notes."
        />
        <HubTile
          to="witchcraft/herbs"
          params={{}}
          glyph="✿"
          title="Herbs Guide"
          blurb="A cabinet of herbs — properties, uses and lore."
        />
      </div>

      {/* ── Spells = witchcraft articles ───────────────────────────────────── */}
      <h2 style={{ fontFamily: 'var(--orn-font)', marginTop: 28 }}>
        <span aria-hidden>✶</span> Spells &amp; Essays
      </h2>
      {!loaded && <p className="note">loading…</p>}
      {loaded && spells.length === 0 && (
        <p className="note">no spells written yet — check back under a fuller moon.</p>
      )}
      {spells.length > 0 && (
        <div className="highlight-grid" style={{ gridTemplateColumns: '1fr', gap: 12, marginTop: 8 }}>
          {spells.map((a) => (
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
