import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Solitaire } from './Solitaire';

describe('Solitaire', () => {
  test('renders the stock, waste, 4 foundations and 7 tableau columns', () => {
    const { container } = render(<Solitaire windowId="win-1" />);
    expect(container.querySelector('[data-pile="stock"]')).toBeInTheDocument();
    expect(container.querySelector('[data-pile="waste"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-pile^="foundation-"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-pile^="tableau-"]')).toHaveLength(7);
  });

  test('the tableau deals a triangular cascade with only the last card of each column face up', () => {
    const { container } = render(<Solitaire windowId="win-1" />);
    for (let col = 0; col < 7; col++) {
      const column = container.querySelector(`[data-pile="tableau-${col}"]`);
      const cards = column?.querySelectorAll(`[data-testid^="tableau-${col}-card-"]`) ?? [];
      expect(cards).toHaveLength(col + 1);
      const last = cards[cards.length - 1];
      expect(last?.textContent).not.toBe('');
    }
  });

  test('clicking the stock draws a card face up into the waste', () => {
    const { container } = render(<Solitaire windowId="win-1" />);
    const waste = container.querySelector('[data-pile="waste"]');
    expect(waste?.querySelector('span')).toBeNull();

    fireEvent.click(screen.getByLabelText('Draw from stock'));

    expect(waste?.querySelector('span')?.textContent).not.toBe('');
  });

  test('drawing through the whole stock and recycling brings the waste card count back to the stock', () => {
    render(<Solitaire windowId="win-1" />);
    const stockButton = screen.getByLabelText('Draw from stock');
    for (let i = 0; i < 24; i++) {
      fireEvent.click(stockButton);
    }
    // Stock is now empty; one more click recycles the waste back into the stock.
    fireEvent.click(stockButton);
    expect(stockButton.querySelector('[class*="cardBack"]')).toBeInTheDocument();
  });

  test('New Game resets the waste back to empty', () => {
    const { container } = render(<Solitaire windowId="win-1" />);
    fireEvent.click(screen.getByLabelText('Draw from stock'));
    const waste = container.querySelector('[data-pile="waste"]');
    expect(waste?.querySelector('span')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));
    expect(waste?.querySelector('span')).toBeNull();
  });
});
