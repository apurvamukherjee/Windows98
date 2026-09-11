import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { Screensaver } from './Screensaver';

describe('Screensaver', () => {
  test('renders without crashing even though jsdom has no real canvas context', () => {
    render(<Screensaver onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: /Screensaver active/ })).toBeInTheDocument();
  });

  test('mouse movement dismisses it', () => {
    const onDismiss = vi.fn();
    render(<Screensaver onDismiss={onDismiss} />);
    fireEvent.mouseMove(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalled();
  });

  test('a key press dismisses it', () => {
    const onDismiss = vi.fn();
    render(<Screensaver onDismiss={onDismiss} />);
    fireEvent.keyDown(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
