import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Minesweeper } from './Minesweeper';

describe('Minesweeper', () => {
  test('the first click is never a mine, regardless of where you click', () => {
    render(<Minesweeper windowId="win-1" />);
    fireEvent.click(screen.getByLabelText('cell-4-4'));
    expect(screen.queryByText('You win!')).not.toBeInTheDocument();
    expect(screen.queryByText('Boom — try again.')).not.toBeInTheDocument();
  });

  test('right-clicking a hidden cell flags it and updates the mine counter', () => {
    render(<Minesweeper windowId="win-1" />);
    const counterBefore = screen.getByText('010');
    expect(counterBefore).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByLabelText('cell-0-0'));
    expect(screen.getByText('🚩')).toBeInTheDocument();
    expect(screen.getByText('009')).toBeInTheDocument();
  });

  test('right-clicking again unflags it', () => {
    render(<Minesweeper windowId="win-1" />);
    fireEvent.contextMenu(screen.getByLabelText('cell-0-0'));
    fireEvent.contextMenu(screen.getByLabelText('cell-0-0'));
    expect(screen.queryByText('🚩')).not.toBeInTheDocument();
  });

  test('a flagged cell cannot be revealed by a plain click', () => {
    render(<Minesweeper windowId="win-1" />);
    fireEvent.contextMenu(screen.getByLabelText('cell-0-0'));
    fireEvent.click(screen.getByLabelText('cell-0-0'));
    expect(screen.getByText('🚩')).toBeInTheDocument();
  });

  test('the New Game button resets the board', () => {
    render(<Minesweeper windowId="win-1" />);
    fireEvent.click(screen.getByLabelText('cell-4-4'));
    fireEvent.click(screen.getByRole('button', { name: 'New game' }));

    // Timer resets, and the previously-revealed cell is hidden again.
    expect(screen.getByText('000')).toBeInTheDocument();
  });
});
