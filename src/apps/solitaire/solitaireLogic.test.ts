import { describe, expect, test } from 'vitest';
import {
  autoMoveToFoundation,
  canStackOnFoundation,
  canStackOnTableau,
  checkWin,
  createDeck,
  deal,
  drawFromStock,
  getPileCards,
  moveCards,
  shuffle,
  type Card,
  type SolitaireState,
} from './solitaireLogic';

describe('createDeck / shuffle', () => {
  test('creates a standard 52-card deck, all face down', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(deck.every((card) => !card.faceUp)).toBe(true);
  });

  test('shuffle preserves every card, just reorders them', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, () => 0.5);
    expect(shuffled).toHaveLength(52);
    for (const card of deck) {
      expect(shuffled.some((c) => c.suit === card.suit && c.rank === card.rank)).toBe(true);
    }
  });
});

describe('deal', () => {
  test('deals 1..7 cards into the seven tableau columns, only the last face up', () => {
    const state = deal(shuffle(createDeck()));
    state.tableau.forEach((pile, i) => {
      expect(pile).toHaveLength(i + 1);
      pile.forEach((card, j) => {
        expect(card.faceUp).toBe(j === pile.length - 1);
      });
    });
  });

  test('the remaining 24 cards go to the stock, face down', () => {
    const state = deal(shuffle(createDeck()));
    expect(state.stock).toHaveLength(24);
    expect(state.stock.every((c) => !c.faceUp)).toBe(true);
  });
});

describe('drawFromStock', () => {
  test('moves the top stock card to the waste, face up', () => {
    const state = deal(shuffle(createDeck()));
    const topOfStock = state.stock[state.stock.length - 1];
    const after = drawFromStock(state);
    expect(after.stock).toHaveLength(state.stock.length - 1);
    expect(after.waste[after.waste.length - 1]).toMatchObject({ ...topOfStock, faceUp: true });
  });

  test('recycles the waste back into the stock, face down, when the stock is empty', () => {
    let state: SolitaireState = { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
    const a: Card = { suit: 'hearts', rank: 1, faceUp: true };
    const b: Card = { suit: 'spades', rank: 2, faceUp: true };
    state = { ...state, waste: [a, b] };

    const after = drawFromStock(state);
    expect(after.waste).toHaveLength(0);
    expect(after.stock).toHaveLength(2);
    expect(after.stock.every((c) => !c.faceUp)).toBe(true);
    // Recycled in reverse order, so drawing again reproduces the original sequence.
    expect(after.stock[after.stock.length - 1]).toMatchObject({ suit: 'hearts', rank: 1 });
  });

  test('is a no-op when both stock and waste are empty', () => {
    const state: SolitaireState = { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
    expect(drawFromStock(state)).toBe(state);
  });
});

describe('canStackOnFoundation', () => {
  test('only an Ace may start an empty foundation', () => {
    expect(canStackOnFoundation({ suit: 'hearts', rank: 1, faceUp: true }, [])).toBe(true);
    expect(canStackOnFoundation({ suit: 'hearts', rank: 2, faceUp: true }, [])).toBe(false);
  });

  test('requires the same suit and the next rank up', () => {
    const foundation: Card[] = [{ suit: 'hearts', rank: 1, faceUp: true }];
    expect(canStackOnFoundation({ suit: 'hearts', rank: 2, faceUp: true }, foundation)).toBe(true);
    expect(canStackOnFoundation({ suit: 'spades', rank: 2, faceUp: true }, foundation)).toBe(false);
    expect(canStackOnFoundation({ suit: 'hearts', rank: 3, faceUp: true }, foundation)).toBe(false);
  });
});

describe('canStackOnTableau', () => {
  test('only a King may start an empty tableau column', () => {
    expect(canStackOnTableau({ suit: 'hearts', rank: 13, faceUp: true }, [])).toBe(true);
    expect(canStackOnTableau({ suit: 'hearts', rank: 12, faceUp: true }, [])).toBe(false);
  });

  test('requires alternating color and the next rank down, on a face-up top card', () => {
    const pile: Card[] = [{ suit: 'spades', rank: 10, faceUp: true }];
    expect(canStackOnTableau({ suit: 'hearts', rank: 9, faceUp: true }, pile)).toBe(true);
    expect(canStackOnTableau({ suit: 'clubs', rank: 9, faceUp: true }, pile)).toBe(false); // same color
    expect(canStackOnTableau({ suit: 'hearts', rank: 8, faceUp: true }, pile)).toBe(false); // wrong rank
  });

  test('cannot stack on a face-down top card', () => {
    const pile: Card[] = [{ suit: 'spades', rank: 10, faceUp: false }];
    expect(canStackOnTableau({ suit: 'hearts', rank: 9, faceUp: true }, pile)).toBe(false);
  });
});

describe('moveCards', () => {
  function emptyState(): SolitaireState {
    return { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
  }

  test('moves a single card from tableau to a valid foundation', () => {
    const state = emptyState();
    state.tableau[0] = [{ suit: 'hearts', rank: 1, faceUp: true }];

    const after = moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'foundation', index: 0 });

    expect(after).not.toBeNull();
    expect(after?.tableau[0]).toHaveLength(0);
    expect(after?.foundations[0]).toEqual([{ suit: 'hearts', rank: 1, faceUp: true }]);
  });

  test('rejects a foundation move that would violate suit/rank order', () => {
    const state = emptyState();
    state.tableau[0] = [{ suit: 'hearts', rank: 2, faceUp: true }];
    expect(moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'foundation', index: 0 })).toBeNull();
  });

  test('moves a valid multi-card run from one tableau column to another', () => {
    const state = emptyState();
    state.tableau[0] = [
      { suit: 'clubs', rank: 8, faceUp: true },
      { suit: 'hearts', rank: 7, faceUp: true },
      { suit: 'spades', rank: 6, faceUp: true },
    ];
    state.tableau[1] = [{ suit: 'diamonds', rank: 9, faceUp: true }];

    const after = moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'tableau', index: 1 });

    expect(after).not.toBeNull();
    expect(after?.tableau[0]).toHaveLength(0);
    expect(after?.tableau[1]).toHaveLength(4);
  });

  test('rejects moving a run that is not itself validly ordered', () => {
    const state = emptyState();
    // 8 and 6 are not consecutive — not a real run.
    state.tableau[0] = [
      { suit: 'clubs', rank: 8, faceUp: true },
      { suit: 'spades', rank: 6, faceUp: true },
    ];
    state.tableau[1] = [{ suit: 'diamonds', rank: 9, faceUp: true }];
    expect(moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'tableau', index: 1 })).toBeNull();
  });

  test('flips the new top card of the source pile face up after a move', () => {
    const state = emptyState();
    state.tableau[0] = [
      { suit: 'clubs', rank: 5, faceUp: false },
      { suit: 'hearts', rank: 1, faceUp: true },
    ];
    const after = moveCards(state, { type: 'tableau', index: 0 }, 1, { type: 'foundation', index: 0 });
    expect(after?.tableau[0]).toEqual([{ suit: 'clubs', rank: 5, faceUp: true }]);
  });

  test('rejects moving a face-down card', () => {
    const state = emptyState();
    state.tableau[0] = [{ suit: 'hearts', rank: 1, faceUp: false }];
    expect(moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'foundation', index: 0 })).toBeNull();
  });

  test('rejects moving more than one card onto a foundation', () => {
    const state = emptyState();
    state.tableau[0] = [
      { suit: 'spades', rank: 2, faceUp: true },
      { suit: 'hearts', rank: 1, faceUp: true },
    ];
    expect(moveCards(state, { type: 'tableau', index: 0 }, 0, { type: 'foundation', index: 0 })).toBeNull();
  });

  test('rejects a foundation or stock as a move source', () => {
    const state = emptyState();
    state.foundations[0] = [{ suit: 'hearts', rank: 1, faceUp: true }];
    expect(moveCards(state, { type: 'foundation', index: 0 }, 0, { type: 'tableau', index: 1 })).toBeNull();
  });

  test('moves the top of the waste onto a valid tableau pile', () => {
    const state = emptyState();
    state.waste = [{ suit: 'hearts', rank: 9, faceUp: true }];
    state.tableau[0] = [{ suit: 'spades', rank: 10, faceUp: true }];

    const after = moveCards(state, { type: 'waste' }, 0, { type: 'tableau', index: 0 });
    expect(after?.waste).toHaveLength(0);
    expect(after?.tableau[0]).toHaveLength(2);
  });
});

describe('autoMoveToFoundation', () => {
  function emptyState(): SolitaireState {
    return { stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] };
  }

  test('sends the top card to the first foundation that accepts it', () => {
    const state = emptyState();
    state.tableau[0] = [{ suit: 'diamonds', rank: 1, faceUp: true }];
    const after = autoMoveToFoundation(state, { type: 'tableau', index: 0 });
    expect(after?.foundations.some((pile) => pile.length === 1)).toBe(true);
  });

  test('returns null when no foundation accepts the card', () => {
    const state = emptyState();
    state.tableau[0] = [{ suit: 'diamonds', rank: 5, faceUp: true }];
    expect(autoMoveToFoundation(state, { type: 'tableau', index: 0 })).toBeNull();
  });

  test('returns null for an empty pile', () => {
    const state = emptyState();
    expect(autoMoveToFoundation(state, { type: 'tableau', index: 0 })).toBeNull();
  });
});

describe('checkWin', () => {
  test('is true only when all four foundations hold all 13 ranks', () => {
    const state: SolitaireState = {
      stock: [],
      waste: [],
      tableau: [[], [], [], [], [], [], []],
      foundations: [
        Array.from({ length: 13 }, (_, i) => ({ suit: 'hearts', rank: (i + 1) as Card['rank'], faceUp: true })),
        Array.from({ length: 13 }, (_, i) => ({ suit: 'diamonds', rank: (i + 1) as Card['rank'], faceUp: true })),
        Array.from({ length: 13 }, (_, i) => ({ suit: 'clubs', rank: (i + 1) as Card['rank'], faceUp: true })),
        Array.from({ length: 12 }, (_, i) => ({ suit: 'spades', rank: (i + 1) as Card['rank'], faceUp: true })),
      ],
    };
    expect(checkWin(state)).toBe(false);
    state.foundations[3].push({ suit: 'spades', rank: 13, faceUp: true });
    expect(checkWin(state)).toBe(true);
  });
});

describe('getPileCards', () => {
  test('reads back the cards for any pile reference', () => {
    const state = deal(shuffle(createDeck()));
    expect(getPileCards(state, { type: 'tableau', index: 3 })).toBe(state.tableau[3]);
    expect(getPileCards(state, { type: 'stock' })).toBe(state.stock);
  });
});
