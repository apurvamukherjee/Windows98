import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'] as const;

/** Calls onIdle once activity has been absent for thresholdMs. Never fires under prefers-reduced-motion. */
export function useIdleTimer(thresholdMs: number, onIdle: () => void): void {
  const timerRef = useRef<number | null>(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const reset = (): void => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => onIdleRef.current(), thresholdMs);
    };

    reset();
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, reset);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, reset);
    };
  }, [thresholdMs]);
}
