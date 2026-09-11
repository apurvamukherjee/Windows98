import { afterEach, describe, expect, test, vi } from 'vitest';
import { decodePileRef, encodePileRef, resolveSolitaireDropTarget } from './pileRefCodec';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('encodePileRef / decodePileRef round trip', () => {
  test.each([
    { type: 'tableau', index: 3 },
    { type: 'foundation', index: 0 },
    { type: 'waste' },
    { type: 'stock' },
  ] as const)('round-trips %o', (ref) => {
    expect(decodePileRef(encodePileRef(ref))).toEqual(ref);
  });

  test('decodePileRef returns null for garbage input', () => {
    expect(decodePileRef('nonsense')).toBeNull();
  });
});

describe('resolveSolitaireDropTarget', () => {
  test('returns null when nothing is at the point', () => {
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
    expect(resolveSolitaireDropTarget(0, 0)).toBeNull();
  });

  test('decodes the nearest ancestor with a data-pile attribute', () => {
    const pileEl = document.createElement('div');
    pileEl.setAttribute('data-pile', 'tableau-2');
    const cardEl = document.createElement('div');
    pileEl.appendChild(cardEl);
    document.body.appendChild(pileEl);

    vi.spyOn(document, 'elementFromPoint').mockReturnValue(cardEl);
    expect(resolveSolitaireDropTarget(10, 10)).toEqual({ type: 'tableau', index: 2 });
  });
});
