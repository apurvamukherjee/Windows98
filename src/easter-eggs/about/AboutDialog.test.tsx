import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AboutDialog } from './AboutDialog';

describe('AboutDialog', () => {
  test('renders the app name and version', () => {
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.getByText('Windows98.app')).toBeInTheDocument();
    expect(screen.getByText(/Version 1\.0/)).toBeInTheDocument();
  });

  test('the credits reel is hidden until the logo is clicked enough times', () => {
    render(<AboutDialog onClose={() => {}} />);
    expect(screen.queryByText('Thanks for clicking the logo.')).not.toBeInTheDocument();

    const logo = screen.getByRole('button', { name: 'Windows98.app logo' });
    for (let i = 0; i < 10; i++) fireEvent.click(logo);

    expect(screen.getByText('Thanks for clicking the logo.')).toBeInTheDocument();
  });

  test('a slow click sequence (more than 800ms apart) never unlocks the reel', () => {
    vi.useFakeTimers();
    render(<AboutDialog onClose={() => {}} />);
    const logo = screen.getByRole('button', { name: 'Windows98.app logo' });

    for (let i = 0; i < 10; i++) {
      fireEvent.click(logo);
      vi.advanceTimersByTime(1000);
    }

    expect(screen.queryByText('Thanks for clicking the logo.')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  test('OK calls onClose', () => {
    const onClose = vi.fn();
    render(<AboutDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
