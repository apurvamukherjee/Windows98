import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

interface MockMediaQueryList {
  matches: boolean;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function createMatchMediaMock(initialMatches: boolean): {
  mql: MockMediaQueryList;
  trigger: (next: boolean) => void;
} {
  let listener: (() => void) | null = null;
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    addEventListener: (_type, cb) => {
      listener = cb;
    },
    removeEventListener: vi.fn(),
  };
  return {
    mql,
    trigger: (next) => {
      mql.matches = next;
      listener?.();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  test('reflects the initial matchMedia state and updates on change events', () => {
    const { mql, trigger } = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    );

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    act(() => {
      trigger(true);
    });
    expect(result.current).toBe(true);
  });

  test('removes the change listener on unmount', () => {
    const { mql } = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mql),
    );

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
