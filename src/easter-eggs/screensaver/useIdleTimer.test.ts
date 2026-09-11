import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useIdleTimer } from './useIdleTimer';

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('calls onIdle after the threshold elapses with no activity', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimer(1000, onIdle));

    vi.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  test('activity resets the timer', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimer(1000, onIdle));

    vi.advanceTimersByTime(800);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  test('does nothing when prefers-reduced-motion is set', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('reduce'),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    const onIdle = vi.fn();
    renderHook(() => useIdleTimer(1000, onIdle));
    vi.advanceTimersByTime(5000);
    expect(onIdle).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
