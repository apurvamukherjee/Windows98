import { describe, expect, test } from 'vitest';
import { KONAMI_SEQUENCE, matchesKonamiCode } from './konami';

describe('matchesKonamiCode', () => {
  test('matches the exact sequence', () => {
    expect(matchesKonamiCode([...KONAMI_SEQUENCE])).toBe(true);
  });

  test('matches when the sequence is the tail of a longer buffer', () => {
    expect(matchesKonamiCode(['x', 'y', ...KONAMI_SEQUENCE])).toBe(true);
  });

  test('matches case-insensitively for the letter keys', () => {
    const buffer = [...KONAMI_SEQUENCE.slice(0, -2), 'B', 'A'];
    expect(matchesKonamiCode(buffer)).toBe(true);
  });

  test('rejects a buffer shorter than the sequence', () => {
    expect(matchesKonamiCode(['ArrowUp', 'ArrowUp'])).toBe(false);
  });

  test('rejects the wrong order', () => {
    const wrong = [...KONAMI_SEQUENCE].reverse();
    expect(matchesKonamiCode(wrong)).toBe(false);
  });
});
