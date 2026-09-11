import { describe, expect, test } from 'vitest';
import { playCrumpleSound } from './crumpleSound';

describe('playCrumpleSound', () => {
  test('does not throw when the Web Audio API is unavailable (e.g. jsdom)', () => {
    expect(() => playCrumpleSound()).not.toThrow();
  });
});
