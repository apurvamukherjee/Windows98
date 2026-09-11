export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
}

export type PileRef =
  | { type: 'tableau'; index: number }
  | { type: 'foundation'; index: number }
  | { type: 'waste' }
  | { type: 'stock' };

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function rankLabel(rank: Rank): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function suitSymbol(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank: rank as Rank, faceUp: false });
    }
  }
  return deck;
}

export function shuffle(deck: Card[], random: () => number = Math.random): Card[] {
  const result = deck.map((card) => ({ ...card }));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = result[i] as Card;
    result[i] = result[j] as Card;
    result[j] = tmp;
  }
  return result;
}

export function deal(shuffledDeck: Card[]): SolitaireState {
  const deck = shuffledDeck.map((card) => ({ ...card, faceUp: false }));
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[idx];
      idx += 1;
      if (card === undefined) continue;
      tableau[col]?.push({ ...card, faceUp: row === col });
    }
  }
  const stock = deck.slice(idx);
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau: tableau as SolitaireState['tableau'],
  };
}

export function drawFromStock(state: SolitaireState): SolitaireState {
  if (state.stock.length === 0) {
    if (state.waste.length === 0) return state;
    return {
      ...state,
      stock: [...state.waste].reverse().map((card) => ({ ...card, faceUp: false })),
      waste: [],
    };
  }
  const stock = [...state.stock];
  const card = stock.pop();
  if (card === undefined) return state;
  return { ...state, stock, waste: [...state.waste, { ...card, faceUp: true }] };
}

export function canStackOnFoundation(card: Card, foundationPile: Card[]): boolean {
  const top = foundationPile[foundationPile.length - 1];
  if (top === undefined) return card.rank === 1;
  return top.suit === card.suit && card.rank === top.rank + 1;
}

export function canStackOnTableau(card: Card, tableauPile: Card[]): boolean {
  const top = tableauPile[tableauPile.length - 1];
  if (top === undefined) return card.rank === 13;
  return top.faceUp && isRed(top.suit) !== isRed(card.suit) && card.rank === top.rank - 1;
}

function isValidRun(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    if (a === undefined || b === undefined) return false;
    if (!a.faceUp || !b.faceUp) return false;
    if (isRed(a.suit) === isRed(b.suit)) return false;
    if (a.rank !== b.rank + 1) return false;
  }
  return true;
}

function getPile(state: SolitaireState, ref: PileRef): Card[] {
  switch (ref.type) {
    case 'tableau':
      return state.tableau[ref.index] ?? [];
    case 'foundation':
      return state.foundations[ref.index] ?? [];
    case 'waste':
      return state.waste;
    case 'stock':
      return state.stock;
  }
}

function setPile(state: SolitaireState, ref: PileRef, pile: Card[]): SolitaireState {
  switch (ref.type) {
    case 'tableau': {
      const tableau = [...state.tableau] as SolitaireState['tableau'];
      tableau[ref.index] = pile;
      return { ...state, tableau };
    }
    case 'foundation': {
      const foundations = [...state.foundations] as SolitaireState['foundations'];
      foundations[ref.index] = pile;
      return { ...state, foundations };
    }
    case 'waste':
      return { ...state, waste: pile };
    case 'stock':
      return { ...state, stock: pile };
  }
}

export function getPileCards(state: SolitaireState, ref: PileRef): Card[] {
  return getPile(state, ref);
}

/**
 * Moves `sourcePile[cardIndex:]` (a card, or a valid face-up run, for
 * tableau-to-tableau moves) onto `to`. Returns null for any illegal move
 * rather than throwing — callers (drag-end, double-click) just no-op on null.
 */
export function moveCards(state: SolitaireState, from: PileRef, cardIndex: number, to: PileRef): SolitaireState | null {
  if (from.type === 'foundation' || from.type === 'stock') return null;
  if (to.type === 'stock') return null;

  const sourcePile = getPile(state, from);
  const moving = sourcePile.slice(cardIndex);
  if (moving.length === 0) return null;
  if (!moving.every((card) => card.faceUp)) return null;
  if (to.type === 'tableau' && !isValidRun(moving)) return null;

  const firstMoving = moving[0];
  if (firstMoving === undefined) return null;

  if (to.type === 'foundation') {
    if (moving.length !== 1) return null;
    if (!canStackOnFoundation(firstMoving, getPile(state, to))) return null;
  } else {
    if (!canStackOnTableau(firstMoving, getPile(state, to))) return null;
  }

  const remainingSource = sourcePile.slice(0, cardIndex);
  const flippedSource =
    from.type === 'tableau' && remainingSource.length > 0
      ? [...remainingSource.slice(0, -1), { ...(remainingSource[remainingSource.length - 1] as Card), faceUp: true }]
      : remainingSource;

  let next = setPile(state, from, flippedSource);
  const destPile = getPile(next, to);
  next = setPile(next, to, [...destPile, ...moving]);
  return next;
}

/** Double-click convenience: sends a pile's top card to the first foundation that accepts it. */
export function autoMoveToFoundation(state: SolitaireState, from: PileRef): SolitaireState | null {
  const pile = getPile(state, from);
  const card = pile[pile.length - 1];
  if (card === undefined || !card.faceUp) return null;
  for (let i = 0; i < 4; i++) {
    if (canStackOnFoundation(card, state.foundations[i] ?? [])) {
      return moveCards(state, from, pile.length - 1, { type: 'foundation', index: i });
    }
  }
  return null;
}

export function checkWin(state: SolitaireState): boolean {
  return state.foundations.every((pile) => pile.length === 13);
}
