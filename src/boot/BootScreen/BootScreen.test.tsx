import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { BootScreen } from './BootScreen';

test('clicking the boot screen dismisses it', () => {
  const onDismiss = vi.fn();
  render(<BootScreen onDismiss={onDismiss} />);
  fireEvent.click(screen.getByRole('button', { name: 'Skip boot screen' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test('a keypress on the boot screen dismisses it', () => {
  const onDismiss = vi.fn();
  render(<BootScreen onDismiss={onDismiss} />);
  fireEvent.keyDown(screen.getByRole('button', { name: 'Skip boot screen' }), { key: 'Enter' });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
