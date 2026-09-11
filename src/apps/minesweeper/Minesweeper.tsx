import { useEffect, useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import {
  checkWin,
  countFlags,
  createEmptyBoard,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
  type Board,
  ROWS,
  COLS,
  MINE_COUNT,
} from './minesweeperLogic';
import styles from './Minesweeper.module.css';

type Status = 'playing' | 'won' | 'lost';

export function Minesweeper(_props: AppComponentProps): React.JSX.Element {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(ROWS, COLS));
  const [status, setStatus] = useState<Status>('playing');
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== 'playing' || startTime === null) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 250);
    return () => clearInterval(interval);
  }, [status, startTime]);

  const reset = (): void => {
    setBoard(createEmptyBoard(ROWS, COLS));
    setStatus('playing');
    setMinesPlaced(false);
    setStartTime(null);
    setElapsed(0);
  };

  const onCellClick = (row: number, col: number): void => {
    if (status !== 'playing') return;
    const cell = board[row]?.[col];
    if (cell === undefined || cell.revealed || cell.flagged) return;

    let workingBoard = board;
    if (!minesPlaced) {
      workingBoard = placeMines(board, MINE_COUNT, row, col);
      setMinesPlaced(true);
      // This runs inside a click handler, not during render — a normal,
      // safe timestamp read, not the purity violation the rule assumes.
      setStartTime(Date.now()); // eslint-disable-line react-hooks/purity
    }

    const { board: revealed, hitMine } = revealCell(workingBoard, row, col);
    if (hitMine) {
      setBoard(revealAllMines(revealed));
      setStatus('lost');
      return;
    }
    setBoard(revealed);
    if (checkWin(revealed)) setStatus('won');
  };

  const onCellContextMenu = (event: React.MouseEvent, row: number, col: number): void => {
    event.preventDefault();
    if (status !== 'playing') return;
    setBoard(toggleFlag(board, row, col));
  };

  const minesRemaining = MINE_COUNT - countFlags(board);
  const face = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂';

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.counter}>{String(Math.max(0, minesRemaining)).padStart(3, '0')}</span>
        <button type="button" className={styles.faceButton} onClick={reset} aria-label="New game">
          {face}
        </button>
        <span className={styles.counter}>{String(Math.min(999, elapsed)).padStart(3, '0')}</span>
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${COLS}, 20px)` }}>
        {board.map((rowCells, r) =>
          rowCells.map((cell, c) => {
            let content = '';
            if (cell.flagged) content = '🚩';
            else if (cell.revealed && cell.isMine) content = '💣';
            else if (cell.revealed && cell.adjacentMines > 0) content = String(cell.adjacentMines);

            const numberClass = cell.revealed && cell.adjacentMines > 0 ? styles[`n${cell.adjacentMines}`] : '';

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                aria-label={`cell-${r}-${c}`}
                className={`${styles.cell} ${cell.revealed ? styles.cellRevealed : ''} ${
                  cell.revealed && cell.isMine ? styles.cellMine : ''
                } ${numberClass ?? ''}`}
                onClick={() => onCellClick(r, c)}
                onContextMenu={(event) => onCellContextMenu(event, r, c)}
              >
                {content}
              </button>
            );
          }),
        )}
      </div>
      {status !== 'playing' && (
        <span className={styles.status}>{status === 'won' ? 'You win!' : 'Boom — try again.'}</span>
      )}
    </div>
  );
}
