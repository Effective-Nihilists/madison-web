// ─── Tarot dataset ──────────────────────────────────────────────────────────
// A fully static dataset of all 78 tarot cards (22 Major Arcana + 56 Minor).
// No database, no migration — this ships in the bundle and is read directly by
// the Tarot Guide, the card detail page and the Digital Oracle. Meanings are
// concise, original paraphrases (not lifted text) in the classic RWS tradition.

export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCard {
  id: string;
  name: string;
  arcana: 'major' | 'minor';
  suit?: TarotSuit;
  /** Minor: 1–10 for pip cards; court cards omit `number`. Major: 0–21. */
  number?: number;
  keywords: string[];
  upright: string;
  reversed: string;
}

// ─── Major Arcana (0 The Fool … XXI The World) ──────────────────────────────
const MAJOR: TarotCard[] = [
  {
    id: 'the-fool',
    name: 'The Fool',
    arcana: 'major',
    number: 0,
    keywords: ['beginnings', 'spontaneity', 'faith', 'innocence'],
    upright: 'A leap into the unknown. Fresh starts, free spirit and trusting the journey without overthinking it.',
    reversed: 'Recklessness, naivety or holding back from a leap you know you should take. Look before you leap.',
  },
  {
    id: 'the-magician',
    name: 'The Magician',
    arcana: 'major',
    number: 1,
    keywords: ['willpower', 'manifestation', 'skill', 'focus'],
    upright: 'You have every tool you need. Channel intention into action and make things happen through focus.',
    reversed: 'Untapped talent, manipulation or scattered energy. Power used poorly or not at all.',
  },
  {
    id: 'the-high-priestess',
    name: 'The High Priestess',
    arcana: 'major',
    number: 2,
    keywords: ['intuition', 'mystery', 'subconscious', 'wisdom'],
    upright: 'Trust your inner voice. Hidden knowledge surfaces when you go quiet and listen to the unseen.',
    reversed: 'Secrets, ignored intuition or surface noise drowning out the still inner knowing.',
  },
  {
    id: 'the-empress',
    name: 'The Empress',
    arcana: 'major',
    number: 3,
    keywords: ['abundance', 'nurturing', 'fertility', 'nature'],
    upright: 'Creativity and care flourish. Sensual abundance, growth and mothering energy in full bloom.',
    reversed: 'Creative block, smothering or neglect of self. Nurture yourself before others.',
  },
  {
    id: 'the-emperor',
    name: 'The Emperor',
    arcana: 'major',
    number: 4,
    keywords: ['authority', 'structure', 'stability', 'control'],
    upright: 'Order, leadership and firm foundations. Build with discipline and protect what you have made.',
    reversed: 'Domination, rigidity or a loss of control. Authority become tyranny or collapse.',
  },
  {
    id: 'the-hierophant',
    name: 'The Hierophant',
    arcana: 'major',
    number: 5,
    keywords: ['tradition', 'belief', 'conformity', 'guidance'],
    upright: 'Shared values, mentorship and time-honoured paths. Wisdom passed down through institutions.',
    reversed: 'Rebellion, dogma questioned or a break from convention. Find your own path.',
  },
  {
    id: 'the-lovers',
    name: 'The Lovers',
    arcana: 'major',
    number: 6,
    keywords: ['union', 'choice', 'harmony', 'values'],
    upright: 'Deep connection and a meaningful choice aligned with your values. Two becoming one.',
    reversed: 'Disharmony, imbalance or a choice made against your truth. Misaligned values.',
  },
  {
    id: 'the-chariot',
    name: 'The Chariot',
    arcana: 'major',
    number: 7,
    keywords: ['drive', 'willpower', 'victory', 'control'],
    upright: 'Forward momentum through determination. Master opposing forces and steer toward triumph.',
    reversed: 'Loss of direction, scattered effort or aggression. The reins have slipped.',
  },
  {
    id: 'strength',
    name: 'Strength',
    arcana: 'major',
    number: 8,
    keywords: ['courage', 'patience', 'compassion', 'inner-power'],
    upright: 'Gentle, quiet power. Tame what is wild through patience and a soft, steady hand.',
    reversed: 'Self-doubt, raw emotion or forcing instead of soothing. Inner strength wavering.',
  },
  {
    id: 'the-hermit',
    name: 'The Hermit',
    arcana: 'major',
    number: 9,
    keywords: ['introspection', 'solitude', 'guidance', 'searching'],
    upright: 'Withdraw to find your answer. Inner light guides you through reflection and solitude.',
    reversed: 'Isolation, loneliness or refusing to seek within. Lost in withdrawal.',
  },
  {
    id: 'wheel-of-fortune',
    name: 'Wheel of Fortune',
    arcana: 'major',
    number: 10,
    keywords: ['cycles', 'fate', 'change', 'turning-point'],
    upright: 'The wheel turns in your favour. Luck, destiny and a welcome shift in the cycle.',
    reversed: 'Bad luck, resistance to change or a downward turn. Cling and you will be dragged.',
  },
  {
    id: 'justice',
    name: 'Justice',
    arcana: 'major',
    number: 11,
    keywords: ['fairness', 'truth', 'cause-and-effect', 'accountability'],
    upright: 'Truth prevails and balance is restored. Decisions weighed fairly; you reap what you sow.',
    reversed: 'Injustice, dishonesty or avoiding accountability. The scales tip unfairly.',
  },
  {
    id: 'the-hanged-man',
    name: 'The Hanged Man',
    arcana: 'major',
    number: 12,
    keywords: ['surrender', 'perspective', 'pause', 'letting-go'],
    upright: 'Surrender brings insight. A new view emerges when you stop struggling and let go.',
    reversed: 'Stalling, needless martyrdom or fear of letting go. A pause overstayed.',
  },
  {
    id: 'death',
    name: 'Death',
    arcana: 'major',
    number: 13,
    keywords: ['endings', 'transformation', 'transition', 'release'],
    upright: 'A profound ending clears the way for rebirth. Release the old; transformation is coming.',
    reversed: 'Resisting change, stagnation or fear of the ending you need. Clinging to the dead.',
  },
  {
    id: 'temperance',
    name: 'Temperance',
    arcana: 'major',
    number: 14,
    keywords: ['balance', 'moderation', 'patience', 'blending'],
    upright: 'Find the middle way. Patience, moderation and a calm blending of opposites heal you.',
    reversed: 'Excess, imbalance or impatience. The careful mixture has spilled over.',
  },
  {
    id: 'the-devil',
    name: 'The Devil',
    arcana: 'major',
    number: 15,
    keywords: ['bondage', 'temptation', 'attachment', 'shadow'],
    upright: 'Chains of your own making — addiction, materialism or fear binding you to the unhealthy.',
    reversed: 'Breaking free, reclaiming power or confronting the shadow. The chains loosen.',
  },
  {
    id: 'the-tower',
    name: 'The Tower',
    arcana: 'major',
    number: 16,
    keywords: ['upheaval', 'revelation', 'collapse', 'awakening'],
    upright: 'Sudden disruption shatters a false foundation. Painful, but it reveals the truth.',
    reversed: 'Fear of change, disaster averted or delaying the inevitable collapse.',
  },
  {
    id: 'the-star',
    name: 'The Star',
    arcana: 'major',
    number: 17,
    keywords: ['hope', 'healing', 'inspiration', 'renewal'],
    upright: 'Calm after the storm. Hope, healing and renewed faith light the way forward.',
    reversed: 'Despair, lost faith or feeling disconnected from hope. The light feels distant.',
  },
  {
    id: 'the-moon',
    name: 'The Moon',
    arcana: 'major',
    number: 18,
    keywords: ['illusion', 'intuition', 'dreams', 'uncertainty'],
    upright: 'Things are not as they seem. Trust intuition through fear, illusion and uncertainty.',
    reversed: 'Confusion lifting, secrets revealed or anxiety released. The fog begins to clear.',
  },
  {
    id: 'the-sun',
    name: 'The Sun',
    arcana: 'major',
    number: 19,
    keywords: ['joy', 'success', 'vitality', 'clarity'],
    upright: 'Radiant joy and success. Warmth, vitality and clear, simple happiness shine on you.',
    reversed: 'Temporary clouds, dimmed optimism or delayed joy. The light is muted, not gone.',
  },
  {
    id: 'judgement',
    name: 'Judgement',
    arcana: 'major',
    number: 20,
    keywords: ['awakening', 'reckoning', 'renewal', 'absolution'],
    upright: 'A wake-up call and a chance to rise renewed. Reckon with the past and answer the call.',
    reversed: 'Self-doubt, avoiding the call or harsh self-judgement. Reckoning postponed.',
  },
  {
    id: 'the-world',
    name: 'The World',
    arcana: 'major',
    number: 21,
    keywords: ['completion', 'fulfilment', 'wholeness', 'achievement'],
    upright: 'A cycle completes in triumph. Wholeness, accomplishment and well-earned fulfilment.',
    reversed: 'Incompletion, loose ends or a delayed finish line. So close, not yet whole.',
  },
];

// ─── Minor Arcana helpers ───────────────────────────────────────────────────
interface PipMeaning { upright: string; reversed: string; keywords: string[] }
interface SuitData {
  suit: TarotSuit;
  label: string;
  pips: Record<number, PipMeaning>;
  courts: Record<'page' | 'knight' | 'queen' | 'king', PipMeaning>;
}

const RANK_NAME: Record<number, string> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
};

const SUITS: SuitData[] = [
  {
    suit: 'wands',
    label: 'Wands',
    pips: {
      1: { keywords: ['inspiration', 'spark', 'potential'], upright: 'A spark of inspiration and creative potential ignites a new venture.', reversed: 'A delayed start, false start or creative block smothers the spark.' },
      2: { keywords: ['planning', 'decisions', 'discovery'], upright: 'Planning ahead and weighing your options before bold expansion.', reversed: 'Fear of the unknown or playing it too safe stalls your plans.' },
      3: { keywords: ['expansion', 'foresight', 'progress'], upright: 'Your ventures set sail; foresight and momentum carry you forward.', reversed: 'Delays, obstacles or short-sighted plans stall progress.' },
      4: { keywords: ['celebration', 'harmony', 'home'], upright: 'Joyful milestones, homecoming and harmony worth celebrating.', reversed: 'A muted celebration or instability at home; harmony withheld.' },
      5: { keywords: ['conflict', 'competition', 'tension'], upright: 'Scrappy competition and clashing egos; productive if channelled.', reversed: 'Avoiding conflict, inner tension or finally finding resolution.' },
      6: { keywords: ['victory', 'recognition', 'pride'], upright: 'Public victory and well-earned recognition; ride high with pride.', reversed: 'Fall from grace, ego or success that goes unnoticed.' },
      7: { keywords: ['defiance', 'perseverance', 'challenge'], upright: 'Stand your ground; defend your position against the challengers.', reversed: 'Overwhelm, giving up or exhaustion under the constant pressure.' },
      8: { keywords: ['speed', 'movement', 'momentum'], upright: 'Swift movement and rapid progress; events accelerate.', reversed: 'Delays, frustration or chaos as the momentum scatters.' },
      9: { keywords: ['resilience', 'persistence', 'boundaries'], upright: 'Battle-weary but unbroken; one last push, hold your boundary.', reversed: 'Burnout, paranoia or defensiveness that no longer serves you.' },
      10: { keywords: ['burden', 'responsibility', 'overload'], upright: 'Carrying a heavy load; success comes at the cost of overwhelm.', reversed: 'Releasing burdens or refusing to delegate until you collapse.' },
    },
    courts: {
      page: { keywords: ['enthusiasm', 'exploration', 'free-spirit'], upright: 'An eager messenger of inspiration; curious, restless and ready to explore.', reversed: 'Scattered enthusiasm, hasty starts or aimless restlessness.' },
      knight: { keywords: ['adventure', 'impulse', 'energy'], upright: 'Bold, charismatic and adventurous; charges after passion headfirst.', reversed: 'Recklessness, impatience or burning bright then fizzling out.' },
      queen: { keywords: ['confidence', 'warmth', 'vitality'], upright: 'Warm, magnetic and self-assured; radiates creative confidence.', reversed: 'Insecurity, jealousy or a demanding, depleted fire.' },
      king: { keywords: ['vision', 'leadership', 'boldness'], upright: 'A visionary leader who inspires action and commands with charisma.', reversed: 'Impulsive or domineering leadership; vision turned ruthless.' },
    },
  },
  {
    suit: 'cups',
    label: 'Cups',
    pips: {
      1: { keywords: ['new-love', 'emotion', 'intuition'], upright: 'An overflowing heart; new love, compassion and emotional opening.', reversed: 'Blocked emotion, emptiness or feelings held back and unexpressed.' },
      2: { keywords: ['partnership', 'attraction', 'union'], upright: 'Mutual attraction and a balanced, heartfelt partnership.', reversed: 'Disharmony, broken trust or a one-sided connection.' },
      3: { keywords: ['friendship', 'celebration', 'community'], upright: 'Joyful friendship, celebration and the warmth of community.', reversed: 'Gossip, isolation or overindulgence among the crowd.' },
      4: { keywords: ['apathy', 'contemplation', 'reevaluation'], upright: 'Withdrawn and discontent; an offered cup goes unnoticed.', reversed: 'Renewed interest, acceptance or shaking off the apathy.' },
      5: { keywords: ['grief', 'loss', 'regret'], upright: 'Dwelling on loss and what spilled; grief clouds what remains.', reversed: 'Acceptance, forgiveness and turning toward the cups still standing.' },
      6: { keywords: ['nostalgia', 'memories', 'innocence'], upright: 'Sweet nostalgia, reunion and the simple kindness of the past.', reversed: 'Stuck in the past or clinging to outgrown innocence.' },
      7: { keywords: ['choices', 'illusion', 'fantasy'], upright: 'Many tempting options, some illusory; choose with clear eyes.', reversed: 'Clarity returns, or paralysis amid too many daydreams.' },
      8: { keywords: ['walking-away', 'searching', 'transition'], upright: 'Leaving behind what no longer fulfils you in search of meaning.', reversed: 'Fear of moving on, or aimless drifting between staying and going.' },
      9: { keywords: ['contentment', 'satisfaction', 'wish'], upright: 'The wish card; emotional satisfaction and comfortable contentment.', reversed: 'Smugness, unfulfilled wishes or shallow indulgence.' },
      10: { keywords: ['harmony', 'family', 'fulfilment'], upright: 'Lasting emotional fulfilment and a harmonious, loving home.', reversed: 'Broken harmony, family strife or a picture-perfect facade.' },
    },
    courts: {
      page: { keywords: ['imagination', 'sensitivity', 'message'], upright: 'A dreamy, sensitive messenger; creative whims and tender feelings.', reversed: 'Emotional immaturity, moodiness or escapism.' },
      knight: { keywords: ['romance', 'charm', 'idealism'], upright: 'The romantic; follows the heart with charm and poetic idealism.', reversed: 'Moodiness, unrealistic dreams or manipulation through feeling.' },
      queen: { keywords: ['compassion', 'intuition', 'nurturing'], upright: 'Deeply empathic and intuitive; a nurturing, emotionally wise heart.', reversed: 'Over-giving, martyrdom or emotions left to overflow.' },
      king: { keywords: ['balance', 'diplomacy', 'calm'], upright: 'Emotionally mastered; calm, diplomatic and compassionate under pressure.', reversed: 'Suppressed feeling, moodiness or emotional manipulation.' },
    },
  },
  {
    suit: 'swords',
    label: 'Swords',
    pips: {
      1: { keywords: ['clarity', 'breakthrough', 'truth'], upright: 'A sharp breakthrough; mental clarity cuts through to the truth.', reversed: 'Confusion, clouded judgement or truth wielded as a weapon.' },
      2: { keywords: ['stalemate', 'indecision', 'avoidance'], upright: 'A blindfolded stalemate; a hard choice avoided through indecision.', reversed: 'Confusion lifts and the decision can finally be faced.' },
      3: { keywords: ['heartbreak', 'sorrow', 'grief'], upright: 'Painful heartbreak and sorrow; the truth that hurts to know.', reversed: 'Healing begins, or sorrow released after holding on too long.' },
      4: { keywords: ['rest', 'recovery', 'contemplation'], upright: 'Necessary rest and retreat; recover and regroup in stillness.', reversed: 'Restlessness, burnout or being forced back too soon.' },
      5: { keywords: ['conflict', 'defeat', 'discord'], upright: 'A hollow victory through conflict; winning at others’ cost.', reversed: 'Making amends, releasing resentment or accepting defeat.' },
      6: { keywords: ['transition', 'moving-on', 'passage'], upright: 'Moving toward calmer waters; a transition away from trouble.', reversed: 'Resisting change or carrying old baggage into the new.' },
      7: { keywords: ['deception', 'strategy', 'stealth'], upright: 'Cunning, secrecy or getting away with something; act strategically.', reversed: 'Deception exposed, conscience or confessing the truth.' },
      8: { keywords: ['restriction', 'helplessness', 'fear'], upright: 'Self-imposed restriction; trapped by fear that is mostly in the mind.', reversed: 'Freeing yourself, new perspective or releasing the limiting belief.' },
      9: { keywords: ['anxiety', 'worry', 'nightmares'], upright: 'Anxiety and sleepless dread; the mind magnifies the night’s fears.', reversed: 'Hope returns; anxiety eases as you reach for help.' },
      10: { keywords: ['endings', 'ruin', 'rock-bottom'], upright: 'A painful but final ending; rock bottom, with only up from here.', reversed: 'Recovery, survival and refusing to let the ending be the end.' },
    },
    courts: {
      page: { keywords: ['curiosity', 'vigilance', 'ideas'], upright: 'A sharp, curious mind; vigilant, restless and hungry for truth.', reversed: 'Scattered thinking, gossip or all talk and no follow-through.' },
      knight: { keywords: ['ambition', 'directness', 'haste'], upright: 'Driven and direct; charges after ideas with fearless ambition.', reversed: 'Recklessness, blunt aggression or thoughts outrunning sense.' },
      queen: { keywords: ['clarity', 'independence', 'honesty'], upright: 'Clear-eyed and independent; perceptive honesty cuts to the point.', reversed: 'Coldness, harsh words or bitterness sharpening the tongue.' },
      king: { keywords: ['intellect', 'authority', 'truth'], upright: 'A master of intellect and principle; fair, truthful and decisive.', reversed: 'Tyranny of logic, cold judgement or manipulation through reason.' },
    },
  },
  {
    suit: 'pentacles',
    label: 'Pentacles',
    pips: {
      1: { keywords: ['opportunity', 'prosperity', 'new-venture'], upright: 'A tangible new opportunity; the seed of prosperity and security.', reversed: 'A missed chance, poor planning or scarcity mindset.' },
      2: { keywords: ['balance', 'adaptability', 'priorities'], upright: 'Juggling priorities with grace; adaptable amid shifting demands.', reversed: 'Overwhelmed, dropping balls or financial disorganisation.' },
      3: { keywords: ['teamwork', 'skill', 'collaboration'], upright: 'Skilled collaboration; building something solid together.', reversed: 'Discord, mediocre work or a lack of teamwork.' },
      4: { keywords: ['security', 'control', 'saving'], upright: 'Holding tight to security and resources; stability through control.', reversed: 'Greed or, freeing up, loosening a too-tight grip.' },
      5: { keywords: ['hardship', 'loss', 'isolation'], upright: 'Material hardship and feeling left out in the cold; help is near.', reversed: 'Recovery from hardship, or deepening into isolation.' },
      6: { keywords: ['generosity', 'giving', 'balance'], upright: 'Generosity flows both ways; giving and receiving in fair balance.', reversed: 'Strings-attached giving, debt or unequal exchange.' },
      7: { keywords: ['patience', 'investment', 'assessment'], upright: 'Pause to assess your investment; long-term growth needs patience.', reversed: 'Impatience, poor returns or effort with little to show.' },
      8: { keywords: ['diligence', 'mastery', 'craft'], upright: 'Diligent craft and steady skill-building; mastery through repetition.', reversed: 'Perfectionism, cut corners or uninspired drudgery.' },
      9: { keywords: ['abundance', 'self-sufficiency', 'luxury'], upright: 'Earned abundance and refined independence; enjoy your comfort.', reversed: 'Overwork, false luxury or financial dependence.' },
      10: { keywords: ['wealth', 'legacy', 'family'], upright: 'Lasting wealth, legacy and the security of an established home.', reversed: 'Financial instability, family disputes or a fragile legacy.' },
    },
    courts: {
      page: { keywords: ['ambition', 'study', 'opportunity'], upright: 'A studious dreamer of practical goals; opportunity worth grounding.', reversed: 'Procrastination, lost focus or all plans and no action.' },
      knight: { keywords: ['reliability', 'routine', 'diligence'], upright: 'Dependable and methodical; the slow, steady worker who finishes.', reversed: 'Stagnation, dullness or stubborn resistance to change.' },
      queen: { keywords: ['nurturing', 'practicality', 'abundance'], upright: 'Grounded, nurturing and resourceful; creates comfort and abundance.', reversed: 'Self-neglect, smothering or work-and-money imbalance.' },
      king: { keywords: ['prosperity', 'security', 'discipline'], upright: 'A prosperous, disciplined provider; builds enduring security.', reversed: 'Greed, materialism or controlling through wealth.' },
    },
  },
];

function buildMinor(): TarotCard[] {
  const cards: TarotCard[] = [];
  for (const s of SUITS) {
    // Pips Ace–10
    for (let n = 1; n <= 10; n++) {
      const pip = s.pips[n];
      const rankName = RANK_NAME[n];
      if (!pip || !rankName) continue;
      cards.push({
        id: `${rankName.toLowerCase()}-of-${s.suit}`,
        name: `${rankName} of ${s.label}`,
        arcana: 'minor',
        suit: s.suit,
        number: n,
        keywords: pip.keywords,
        upright: pip.upright,
        reversed: pip.reversed,
      });
    }
    // Court cards
    const courtOrder: ('page' | 'knight' | 'queen' | 'king')[] = ['page', 'knight', 'queen', 'king'];
    for (const rank of courtOrder) {
      const c = s.courts[rank];
      const rankLabel = rank.charAt(0).toUpperCase() + rank.slice(1);
      cards.push({
        id: `${rank}-of-${s.suit}`,
        name: `${rankLabel} of ${s.label}`,
        arcana: 'minor',
        suit: s.suit,
        keywords: c.keywords,
        upright: c.upright,
        reversed: c.reversed,
      });
    }
  }
  return cards;
}

// ─── Full deck (78 cards) + lookup ──────────────────────────────────────────
export const TAROT: TarotCard[] = [...MAJOR, ...buildMinor()];

const BY_ID = new Map<string, TarotCard>(TAROT.map((c) => [c.id, c]));

export function tarotById(id: string): TarotCard | undefined {
  return BY_ID.get(id);
}

// Roman-numeral helper for Major Arcana display (0 → '0', 21 → 'XXI').
const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
export function toRoman(n: number): string {
  if (n === 0) return '0';
  let out = '';
  let rem = n;
  for (const [value, sym] of ROMAN) {
    while (rem >= value) {
      out += sym;
      rem -= value;
    }
  }
  return out;
}

export const TAROT_SUITS: readonly { key: TarotSuit; label: string }[] = [
  { key: 'wands', label: 'Wands' },
  { key: 'cups', label: 'Cups' },
  { key: 'swords', label: 'Swords' },
  { key: 'pentacles', label: 'Pentacles' },
];
