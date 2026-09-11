export interface Cell {
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
}

export type Board = Cell[][];

export const ROWS = 9;
export const COLS = 9;
export const MINE_COUNT = 10;

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ isMine: false, revealed: false, flagged: false, adjacentMines: 0 })),
  );
}

function neighborsOf(row: number, col: number, rows: number, cols: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) result.push([r, c]);
    }
  }
  return result;
}

/** Places mines avoiding (excludeRow, excludeCol) — the classic "your first click is never a mine" courtesy. */
export function placeMines(
  board: Board,
  mineCount: number,
  excludeRow: number,
  excludeCol: number,
  random: () => number = Math.random,
): Board {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const next = board.map((row) => row.map((cell) => ({ ...cell })));

  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === excludeRow && c === excludeCol) continue;
      candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = candidates[i] as [number, number];
    candidates[i] = candidates[j] as [number, number];
    candidates[j] = tmp;
  }
  for (const [r, c] of candidates.slice(0, mineCount)) {
    const cell = next[r]?.[c];
    if (cell !== undefined) cell.isMine = true;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = next[r]?.[c];
      if (cell === undefined || cell.isMine) continue;
      cell.adjacentMines = neighborsOf(r, c, rows, cols).filter(([nr, nc]) => next[nr]?.[nc]?.isMine === true).length;
    }
  }

  return next;
}

/** Reveals a cell, flood-filling outward through connected zero-adjacency cells. */
export function revealCell(board: Board, row: number, col: number): { board: Board; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const next = board.map((r) => r.map((cell) => ({ ...cell })));
  const startCell = next[row]?.[col];
  if (startCell === undefined || startCell.revealed || startCell.flagged) return { board: next, hitMine: false };

  if (startCell.isMine) {
    startCell.revealed = true;
    return { board: next, hitMine: true };
  }

  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop() as [number, number];
    const cell = next[r]?.[c];
    if (cell === undefined || cell.revealed || cell.flagged || cell.isMine) continue;
    cell.revealed = true;
    if (cell.adjacentMines === 0) {
      for (const [nr, nc] of neighborsOf(r, c, rows, cols)) stack.push([nr, nc]);
    }
  }

  return { board: next, hitMine: false };
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  const cell = board[row]?.[col];
  if (cell === undefined || cell.revealed) return board;
  const next = board.map((r) => r.map((c) => ({ ...c })));
  const target = next[row]?.[col];
  if (target !== undefined) target.flagged = !target.flagged;
  return next;
}

export function revealAllMines(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell.isMine ? { ...cell, revealed: true } : cell)));
}

export function checkWin(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell.isMine || cell.revealed));
}

export function countFlags(board: Board): number {
  return board.reduce((sum, row) => sum + row.filter((cell) => cell.flagged).length, 0);
}
