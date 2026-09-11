import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { Bsod } from './Bsod';

describe('Bsod', () => {
  test('renders the crash screen first', () => {
    render(<Bsod onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: /reboot/i })).toBeInTheDocument();
  });

  test('clicking transitions to the reboot (boot) screen', () => {
    render(<Bsod onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reboot/i }));
    expect(screen.getByRole('button', { name: 'Skip boot screen' })).toBeInTheDocument();
  });

  test('dismissing the boot screen calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<Bsod onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /reboot/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip boot screen' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
