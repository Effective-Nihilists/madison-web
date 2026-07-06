import { useMemo, useState, type ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';
import { TAROT, TAROT_SUITS, type TarotSuit } from '../../../shared/tarot';
import TarotCardFace from './TarotCardFace';

type ArcanaFilter = 'all' | 'major' | 'minor';
type SuitFilter = 'all' | TarotSuit;

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="tbtn"
      onClick={onClick}
      style={active ? { borderColor: 'var(--text)', fontWeight: 700 } : undefined}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// TarotGuidePage — a filterable grid of all 78 cards. Each tile shows the
// inline-SVG face + name + keywords and links to its detail page.
export default function TarotGuidePage(): ReactElement {
  const [arcana, setArcana] = useState<ArcanaFilter>('all');
  const [suit, setSuit] = useState<SuitFilter>('all');

  const cards = useMemo(() => {
    return TAROT.filter((c) => {
      if (arcana !== 'all' && c.arcana !== arcana) return false;
      if (suit !== 'all' && c.suit !== suit) return false;
      return true;
    });
  }, [arcana, suit]);

  // Suit filter only makes sense for the minor arcana.
  const suitDisabled = arcana === 'major';

  return (
    <Win9xWindow title="tarot.dir — Explorer" className="article-win" bodyClassName="doc-body">
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        ›{' '}
        <Link to="corner/:corner" params={{ corner: 'witchcraft' }} style={{ color: 'inherit' }}>
          Witchcraft Corner
        </Link>{' '}
        › Tarot Guide
      </div>
      <h1 className="article">
        <span aria-hidden>✦</span> Tarot Guide
      </h1>
      <p className="note">All 78 cards of the deck — the Major Arcana and the four suits.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '12px 0' }}>
        <span className="note" style={{ marginRight: 4 }}>
          arcana
        </span>
        <FilterButton active={arcana === 'all'} label="all" onClick={() => { setArcana('all'); }} />
        <FilterButton
          active={arcana === 'major'}
          label="major"
          onClick={() => {
            setArcana('major');
            setSuit('all');
          }}
        />
        <FilterButton active={arcana === 'minor'} label="minor" onClick={() => { setArcana('minor'); }} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          margin: '4px 0 12px',
          opacity: suitDisabled ? 0.4 : 1,
          pointerEvents: suitDisabled ? 'none' : 'auto',
        }}
      >
        <span className="note" style={{ marginRight: 4 }}>
          suit
        </span>
        <FilterButton active={suit === 'all'} label="all" onClick={() => { setSuit('all'); }} />
        {TAROT_SUITS.map((s) => (
          <FilterButton
            key={s.key}
            active={suit === s.key}
            label={s.label.toLowerCase()}
            onClick={() => { setSuit(s.key); }}
          />
        ))}
      </div>

      <p className="note">{cards.length} cards</p>

      <div
        className="highlight-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginTop: 8 }}
      >
        {cards.map((c) => (
          <Link
            key={c.id}
            to="witchcraft/tarot/:cardId"
            params={{ cardId: c.id }}
            className="card"
            style={{ display: 'block', marginBottom: 0, textDecoration: 'none', textAlign: 'center' }}
          >
            <TarotCardFace card={c} height={170} />
            <div style={{ fontWeight: 700, fontFamily: 'var(--orn-font)', marginTop: 8 }}>{c.name}</div>
            <div className="note" style={{ marginTop: 2, fontSize: '.8em' }}>
              {c.keywords.slice(0, 3).join(' · ')}
            </div>
          </Link>
        ))}
      </div>
    </Win9xWindow>
  );
}
