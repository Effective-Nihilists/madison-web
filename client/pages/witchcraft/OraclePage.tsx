import { useState, type ReactElement } from 'react';
import Win9xWindow from '../../components/Win9xWindow';
import { Link } from '../../router';
import { TAROT, type TarotCard } from '../../../shared/tarot';
import TarotCardFace from './TarotCardFace';

type Spread = 1 | 3;

interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: string; // '' for single-card, 'Past' | 'Present' | 'Future' for the spread
}

const SPREAD_POSITIONS: Record<Spread, string[]> = {
  1: [''],
  3: ['Past', 'Present', 'Future'],
};

// Draw N distinct cards at random, each randomly upright/reversed. Pure
// client-side — no server call, no AI.
function drawCards(spread: Spread): DrawnCard[] {
  const positions = SPREAD_POSITIONS[spread];
  const pool = [...TAROT];
  const drawn: DrawnCard[] = [];
  for (let i = 0; i < spread; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool.splice(idx, 1)[0];
    if (!card) break;
    drawn.push({ card, reversed: Math.random() < 0.5, position: positions[i] ?? '' });
  }
  return drawn;
}

// Compose a short narrative by stitching each drawn card's active meaning into
// its spread position. Template-only — deterministic given the draw, no AI.
function composeReading(drawn: DrawnCard[]): string {
  const meaning = (d: DrawnCard): string => (d.reversed ? d.card.reversed : d.card.upright);

  const orient = (d: DrawnCard): string => (d.reversed ? 'reversed' : 'upright');

  const [past, present, future] = drawn;
  if (drawn.length === 1 || !present || !future) {
    const d = drawn[0];
    if (!d) return '';
    return `The cards offer you ${d.card.name} (${orient(d)}). ${meaning(d)} Sit with this energy as you move through your day.`;
  }
  if (!past) return '';

  return [
    `Your past is shaped by ${past.card.name} (${orient(past)}). ${meaning(past)}`,
    `In the present, ${present.card.name} (${orient(present)}) holds sway. ${meaning(present)}`,
    `Looking ahead, ${future.card.name} (${orient(future)}) lights the path. ${meaning(future)}`,
    `Read together, the spread asks you to carry the lessons of ${past.card.name.toLowerCase()} into the promise of ${future.card.name.toLowerCase()}.`,
  ].join(' ');
}

// One drawn card tile with its position label, face, orientation and meaning.
function DrawnTile({ drawn }: { drawn: DrawnCard }): ReactElement {
  const { card, reversed, position } = drawn;
  return (
    <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
      {position && (
        <div className="note" style={{ textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          {position}
        </div>
      )}
      <TarotCardFace card={card} reversed={reversed} height={200} />
      <Link
        to="witchcraft/tarot/:cardId"
        params={{ cardId: card.id }}
        style={{ display: 'block', fontWeight: 700, fontFamily: 'var(--orn-font)', marginTop: 8, textDecoration: 'none' }}
      >
        {card.name}
      </Link>
      <div className="note" style={{ fontSize: '.85em' }}>{reversed ? 'reversed ☾' : 'upright ☼'}</div>
      <p style={{ margin: '.5em 0 0', fontSize: '.92em' }}>{reversed ? card.reversed : card.upright}</p>
    </div>
  );
}

// OraclePage — the Digital Oracle. Pick a 1-card or 3-card spread, then Draw to
// pull cards at random client-side and read the composed narrative below.
export default function OraclePage(): ReactElement {
  const [spread, setSpread] = useState<Spread>(1);
  const [drawn, setDrawn] = useState<DrawnCard[] | null>(null);
  const [drawing, setDrawing] = useState(false);
  // Bump on each draw so the reveal animation re-runs even at the same spread.
  const [drawKey, setDrawKey] = useState(0);

  function handleDraw(): void {
    setDrawing(true);
    setDrawn(null);
    // A short shuffle beat for a touch of magic before the reveal.
    window.setTimeout(() => {
      setDrawn(drawCards(spread));
      setDrawKey((k) => k + 1);
      setDrawing(false);
    }, 650);
  }

  return (
    <Win9xWindow title="oracle.exe — Digital Oracle" className="article-win" bodyClassName="doc-body">
      <style>{`
        @keyframes oracle-reveal {
          0%   { opacity: 0; transform: translateY(14px) scale(.96) rotate(-2deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @keyframes oracle-shuffle {
          0%,100% { transform: translateY(0) rotate(0); }
          25%     { transform: translateY(-6px) rotate(-3deg); }
          75%     { transform: translateY(-6px) rotate(3deg); }
        }
      `}</style>

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
        › Digital Oracle
      </div>

      <h1 className="article" style={{ textAlign: 'center' }}>
        <span aria-hidden>☽</span> Digital Oracle <span aria-hidden>☽</span>
      </h1>
      <p className="note" style={{ textAlign: 'center' }}>
        Still your mind, hold your question, and let the cards answer.
      </p>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
        <button
          type="button"
          className="tbtn"
          aria-pressed={spread === 1}
          onClick={() => { setSpread(1); }}
          style={spread === 1 ? { borderColor: 'var(--text)', fontWeight: 700 } : undefined} data-id="single-card"
        >
          single card
        </button>
        <button
          type="button"
          className="tbtn"
          aria-pressed={spread === 3}
          onClick={() => { setSpread(3); }}
          style={spread === 3 ? { borderColor: 'var(--text)', fontWeight: 700 } : undefined} data-id="past-present-future"
        >
          past · present · future
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
        <button type="button" className="tbtn" onClick={handleDraw} disabled={drawing} style={{ fontSize: '1.05em', padding: '10px 22px' }} data-id="button">
          {drawing ? 'shuffling…' : drawn ? 'draw again ✦' : 'draw the cards ✦'}
        </button>
      </div>

      {drawing && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {Array.from({ length: spread }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                width: 90,
                height: 135,
                borderRadius: 10,
                border: '3px solid var(--panel-edge)',
                background: 'repeating-linear-gradient(45deg, var(--surface-solid), var(--surface-solid) 6px, color-mix(in srgb, var(--panel-edge) 30%, var(--surface-solid)) 6px, color-mix(in srgb, var(--panel-edge) 30%, var(--surface-solid)) 12px)',
                animation: `oracle-shuffle .65s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {drawn && (
        <div key={drawKey}>
          <div
            className="highlight-grid"
            style={{
              gridTemplateColumns:
                drawn.length === 1 ? 'minmax(220px, 320px)' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {drawn.map((d, i) => (
              <div
                key={`${d.card.id}-${i}`}
                style={{ animation: `oracle-reveal .5s ease-out ${i * 0.12}s both` }}
              >
                <DrawnTile drawn={d} />
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h2 style={{ margin: '.1em 0', fontFamily: 'var(--orn-font)' }}>
              <span aria-hidden>✶</span> Your reading
            </h2>
            <p style={{ margin: '.5em 0 0', lineHeight: 1.6 }}>{composeReading(drawn)}</p>
            <p className="note" style={{ marginTop: 12, fontStyle: 'italic' }}>
              (AI-written readings coming soon)
            </p>
          </div>
        </div>
      )}
    </Win9xWindow>
  );
}
