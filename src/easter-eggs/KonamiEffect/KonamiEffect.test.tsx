import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { KONAMI_SEQUENCE } from '../konami';
import { KonamiEffect } from './KonamiEffect';

function typeSequence(keys: readonly string[]): void {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
  }
}

describe('KonamiEffect', () => {
  afterEach(() => {
    document.body.className = '';
    vi.useRealTimers();
  });

  test('entering the Konami code adds a wobble class to the body', () => {
    render(<KonamiEffect />);
    typeSequence(KONAMI_SEQUENCE);
    expect(document.body.className).not.toBe('');
  });

  test('unrelated key presses do not trigger it', () => {
    render(<KonamiEffect />);
    typeSequence(['a', 'b', 'c', 'd', 'e']);
    expect(document.body.className).toBe('');
  });

  test('the wobble class is removed after it plays', () => {
    vi.useFakeTimers();
    render(<KonamiEffect />);
    typeSequence(KONAMI_SEQUENCE);
    expect(document.body.className).not.toBe('');

    vi.advanceTimersByTime(1300);
    expect(document.body.className).toBe('');
  });
});
