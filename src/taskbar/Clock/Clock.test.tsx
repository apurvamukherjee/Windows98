import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Clock } from './Clock';

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders the current time', () => {
    render(<Clock />);
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  test('double-clicking opens the Date/Time Properties dialog', () => {
    render(<Clock />);
    expect(screen.queryByRole('dialog', { name: 'Date/Time Properties' })).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByRole('button'));
    expect(screen.getByRole('dialog', { name: 'Date/Time Properties' })).toBeInTheDocument();
  });

  test('OK closes the dialog', () => {
    render(<Clock />);
    fireEvent.doubleClick(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog', { name: 'Date/Time Properties' })).not.toBeInTheDocument();
  });
});
