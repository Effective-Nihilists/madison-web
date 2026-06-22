import type { ReactElement } from 'react';
import { toRoman, type TarotCard, type TarotSuit } from '../../../shared/tarot';

// Muted-rainbow accent per suit / major arcana — drives the inline-SVG face so
// each card reads at a glance without any card artwork.
const SUIT_ACCENT: Record<TarotSuit | 'major', string> = {
  wands: '#c98a4b',
  cups: '#5b8ec9',
  swords: '#8a8f99',
  pentacles: '#6fa86b',
  major: '#9c7bc1',
};

const SUIT_GLYPH: Record<TarotSuit, string> = {
  wands: '♣',
  cups: '♥',
  swords: '♠',
  pentacles: '♦',
};

function accentFor(card: TarotCard): string {
  return card.arcana === 'major' ? SUIT_ACCENT.major : SUIT_ACCENT[card.suit ?? 'major'];
}

// The big centred sigil: roman numeral for majors, suit glyph + rank for minors.
function faceSigil(card: TarotCard): string {
  if (card.arcana === 'major') return toRoman(card.number ?? 0);
  const glyph = card.suit ? SUIT_GLYPH[card.suit] : '✦';
  return glyph;
}

// TarotCardFace — a CSS/inline-SVG stand-in for card art. `reversed` flips the
// face 180° to signal a reversed draw. Decorative glyphs only (✦ ☽ suit pips).
export default function TarotCardFace({
  card,
  reversed = false,
  height = 220,
}: {
  card: TarotCard;
  reversed?: boolean;
  height?: number;
}): ReactElement {
  const accent = accentFor(card);
  const sigil = faceSigil(card);
  const rankLabel =
    card.arcana === 'major'
      ? toRoman(card.number ?? 0)
      : card.number !== undefined
        ? String(card.number)
        : card.name.split(' ')[0]; // Page/Knight/Queen/King

  return (
    <div
      aria-hidden
      style={{
        height,
        aspectRatio: '2 / 3',
        margin: '0 auto',
        borderRadius: 12,
        border: `3px solid ${accent}`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 16%, var(--surface-solid)), var(--surface-solid))`,
        boxShadow: 'inset 0 0 0 2px var(--surface-solid), inset 0 0 0 4px var(--panel-edge)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: 10,
        transform: reversed ? 'rotate(180deg)' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--orn-font)', color: accent, fontWeight: 700 }}>
        <span>{rankLabel}</span>
        <span>{card.arcana === 'major' ? '✦' : card.suit ? SUIT_GLYPH[card.suit] : '✦'}</span>
      </div>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <svg width="60%" height="60%" viewBox="0 0 100 100" role="presentation">
          <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.35" />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="34"
            fontFamily="var(--orn-font)"
            fill={accent}
          >
            {sigil}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--orn-font)', color: accent, fontWeight: 700, transform: 'rotate(180deg)' }}>
        <span>{rankLabel}</span>
        <span>{card.arcana === 'major' ? '✦' : card.suit ? SUIT_GLYPH[card.suit] : '✦'}</span>
      </div>
    </div>
  );
}
