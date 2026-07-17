import type { ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';
import { tarotById, toRoman } from '../../../shared/tarot';
import TarotCardFace from './TarotCardFace';

// Small labelled block for an upright / reversed meaning.
function MeaningBlock({
  title,
  glyph,
  text,
}: {
  title: string;
  glyph: string;
  text: string;
}): ReactElement {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>
        <span aria-hidden>{glyph}</span> {title}
      </h2>
      <p style={{ margin: '.4em 0 0' }}>{text}</p>
    </div>
  );
}

// TarotCardPage — detail for one card (`:cardId`). Shows the face, keywords,
// and upright + reversed meanings. 404 panel if the id is unknown.
export default function TarotCardPage({
  cardId,
}: {
  cardId: string;
}): ReactElement {
  const card = tarotById(cardId);

  if (!card) {
    return (
      <Win9xWindow
        title="tarot — 404"
        className="article-win"
        bodyClassName="doc-body"
      >
        <h1 className="article">Card not found</h1>
        <p className="note">No tarot card matches “{cardId}”.</p>
        <Link
          to="witchcraft/tarot"
          params={{}}
          className="tbtn"
          style={{ marginTop: 12 }}
        >
          ← back to the Tarot Guide
        </Link>
      </Win9xWindow>
    );
  }

  const subtitle =
    card.arcana === 'major'
      ? `Major Arcana · ${toRoman(card.number ?? 0)}`
      : `Minor Arcana · ${card.suit ?? ''}`;

  return (
    <Win9xWindow
      title={`${card.id}.card`}
      className="article-win"
      bodyClassName="doc-body"
    >
      <div className="breadcrumb">
        <b>
          <Link to="" params={{}} style={{ color: 'inherit' }}>
            Home
          </Link>
        </b>{' '}
        ›{' '}
        <Link
          to="corner/:corner"
          params={{ corner: 'witchcraft' }}
          style={{ color: 'inherit' }}
        >
          Witchcraft Corner
        </Link>{' '}
        ›{' '}
        <Link to="witchcraft/tarot" params={{}} style={{ color: 'inherit' }}>
          Tarot Guide
        </Link>{' '}
        › {card.name}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginTop: 8,
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <TarotCardFace card={card} height={300} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="article" style={{ marginTop: 0 }}>
            {card.name}
          </h1>
          <p className="note" style={{ textTransform: 'capitalize' }}>
            {subtitle}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              margin: '8px 0',
            }}
          >
            {card.keywords.map((k) => (
              <span
                key={k}
                className="note"
                style={{
                  display: 'inline-block',
                  padding: '1px 8px',
                  borderRadius: 999,
                  border: '2px solid var(--panel-edge)',
                  background: 'var(--surface-solid)',
                  fontSize: '.8em',
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="highlight-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <MeaningBlock title="Upright" glyph="☼" text={card.upright} />
        <MeaningBlock title="Reversed" glyph="☾" text={card.reversed} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link to="witchcraft/tarot" params={{}} className="tbtn">
          ← Tarot Guide
        </Link>
        <Link to="witchcraft/oracle" params={{}} className="tbtn">
          consult the Oracle ✦
        </Link>
      </div>
    </Win9xWindow>
  );
}
