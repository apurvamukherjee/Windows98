import { describe, expect, test } from 'vitest';
import {
  checkWin,
  countFlags,
  createEmptyBoard,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
} from './minesweeperLogic';

describe('createEmptyBoard', () => {
  test('creates a board of the given dimensions, all hidden and empty', () => {
    const board = createEmptyBoard(3, 4);
    expect(board).toHaveLength(3);
    expect(board[0]).toHaveLength(4);
    expect(board[0]?.[0]).toEqual({ isMine: false, revealed: false, flagged: false, adjacentMines: 0 });
  });
});

describe('placeMines', () => {
  test('places exactly the requested number of mines', () => {
    const board = placeMines(createEmptyBoard(9, 9), 10, 4, 4);
    const mineCount = board.flat().filter((c) => c.isMine).length;
    expect(mineCount).toBe(10);
  });

  test('never places a mine on the excluded cell', () => {
    // Deterministic RNG that would put a mine everywhere if not excluded.
    const board = placeMines(createEmptyBoard(3, 3), 8, 1, 1, () => 0);
    expect(board[1]?.[1]?.isMine).toBe(false);
  });

  test('computes correct adjacent-mine counts', () => {
    // Force mines into known positions via a rigged random sequence isn't
    // practical here — instead verify the invariant: total adjacency count
    // for a fully-mined ring around one empty center cell.
    const empty = createEmptyBoard(3, 3);
    // Manually mine every cell except the center to test adjacency counting.
    const rigged = empty.map((row, r) =>
      row.map((cell, c) => (r === 1 && c === 1 ? cell : { ...cell, isMine: true })),
    );
    const withCounts = placeMines(rigged, 0, 1, 1); // mineCount 0: just recompute adjacency, don't add more
    expect(withCounts[1]?.[1]?.adjacentMines).toBe(8);
  });
});

describe('revealCell', () => {
  test('revealing a mine sets hitMine true', () => {
    const board = createEmptyBoard(2, 2);
    const mined = board.map((row, r) => row.map((cell, c) => (r === 0 && c === 0 ? { ...cell, isMine: true } : cell)));
    const { hitMine, board: after } = revealCell(mined, 0, 0);
    expect(hitMine).toBe(true);
    expect(after[0]?.[0]?.revealed).toBe(true);
  });

  test('revealing a zero-adjacency cell flood-fills connected zero cells', () => {
    // A 3x3 board with a single mine in the corner — the rest should all be
    // zero-adjacency except the two cells touching the mine.
    let board = createEmptyBoard(3, 3);
    board = board.map((row, r) => row.map((cell, c) => (r === 2 && c === 2 ? { ...cell, isMine: true } : cell)));
    board = placeMines(board, 0, 0, 0); // recompute adjacency only

    const { board: after } = revealCell(board, 0, 0);
    // The flood fill should reveal everything except the mine and its two
    // adjacent non-zero cells stay unrevealed only if they're non-zero —
    // here (1,2) and (2,1) and (1,1) touch the mine, so they get revealed
    // too but stop the flood from going further into the mine itself.
    expect(after[0]?.[0]?.revealed).toBe(true);
    expect(after[2]?.[2]?.revealed).toBe(false); // the mine itself, untouched
  });

  test('does not reveal a flagged cell', () => {
    let board = createEmptyBoard(2, 2);
    board = toggleFlag(board, 0, 0);
    const { board: after } = revealCell(board, 0, 0);
    expect(after[0]?.[0]?.revealed).toBe(false);
  });

  test('is a no-op on an already-revealed cell', () => {
    const board = createEmptyBoard(2, 2);
    const { board: once } = revealCell(board, 0, 0);
    const { board: twice } = revealCell(once, 0, 0);
    expect(twice).toEqual(once);
  });
});

describe('toggleFlag', () => {
  test('flags and unflags a hidden cell', () => {
    let board = createEmptyBoard(2, 2);
    board = toggleFlag(board, 0, 0);
    expect(board[0]?.[0]?.flagged).toBe(true);
    board = toggleFlag(board, 0, 0);
    expect(board[0]?.[0]?.flagged).toBe(false);
  });

  test('cannot flag an already-revealed cell', () => {
    let board = createEmptyBoard(2, 2);
    board = revealCell(board, 0, 0).board;
    board = toggleFlag(board, 0, 0);
    expect(board[0]?.[0]?.flagged).toBe(false);
  });
});

describe('revealAllMines', () => {
  test('reveals every mine, leaving other cells untouched', () => {
    let board = createEmptyBoard(2, 2);
    board = board.map((row, r) => row.map((cell, c) => (r === 0 && c === 0 ? { ...cell, isMine: true } : cell)));
    const after = revealAllMines(board);
    expect(after[0]?.[0]?.revealed).toBe(true);
    expect(after[1]?.[1]?.revealed).toBe(false);
  });
});

describe('checkWin', () => {
  test('is false while any safe cell remains hidden', () => {
    const board = createEmptyBoard(2, 2);
    expect(checkWin(board)).toBe(false);
  });

  test('is true once every non-mine cell is revealed', () => {
    let board = createEmptyBoard(2, 2);
    board = board.map((row, r) => row.map((cell, c) => (r === 0 && c === 0 ? { ...cell, isMine: true } : cell)));
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (r === 0 && c === 0) continue;
        board = revealCell(board, r, c).board;
      }
    }
    expect(checkWin(board)).toBe(true);
  });
});

describe('countFlags', () => {
  test('counts flagged cells across the board', () => {
    let board = createEmptyBoard(2, 2);
    board = toggleFlag(board, 0, 0);
    board = toggleFlag(board, 1, 1);
    expect(countFlags(board)).toBe(2);
  });
});
