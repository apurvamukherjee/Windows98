import { useCallback, useEffect, useRef } from 'react';

export interface PointerDragHandlers {
  onDragStart?: () => void;
  onDrag: (dx: number, dy: number) => void;
  onDragEnd: (dx: number, dy: number) => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Drives a drag gesture entirely outside React state: onDrag fires at most
 * once per animation frame with the cumulative delta from drag start, so the
 * caller can write directly to a DOM node (e.g. via a ref) instead of
 * triggering a re-render on every pointermove. onDragEnd fires exactly once,
 * on release, cancellation, or the window losing focus mid-gesture — that's
 * the only point a caller should commit to React state.
 */
export function usePointerDrag({ onDragStart, onDrag, onDragEnd }: PointerDragHandlers): {
  onPointerDown: (event: React.PointerEvent) => void;
} {
  const startPoint = useRef<Point>({ x: 0, y: 0 });
  const delta = useRef<Point>({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const endGesture = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => endGesture.current?.();
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const pointerId = event.pointerId;
      try {
        event.currentTarget.setPointerCapture(pointerId);
      } catch {
        // Some browsers/pointer types reject capture; the gesture still
        // works via the window-level listeners below.
      }

      startPoint.current = { x: event.clientX, y: event.clientY };
      delta.current = { x: 0, y: 0 };
      onDragStart?.();

      const scheduleFrame = (): void => {
        if (rafId.current !== null) return;
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          onDrag(delta.current.x, delta.current.y);
        });
      };

      const handleMove = (moveEvent: PointerEvent): void => {
        delta.current = {
          x: moveEvent.clientX - startPoint.current.x,
          y: moveEvent.clientY - startPoint.current.y,
        };
        scheduleFrame();
      };

      const finish = (): void => {
        cleanup();
        onDragEnd(delta.current.x, delta.current.y);
      };

      function cleanup(): void {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        window.removeEventListener('blur', finish);
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        endGesture.current = null;
      }

      endGesture.current = finish;

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
      window.addEventListener('blur', finish);
    },
    [onDrag, onDragEnd, onDragStart],
  );

  return { onPointerDown };
}
