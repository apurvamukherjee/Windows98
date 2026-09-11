import type { Rect } from '../stores/windowStore';

export const MIN_WIDTH = 200;
export const MIN_HEIGHT = 150;

export const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
export type ResizeHandle = (typeof RESIZE_HANDLES)[number];

/**
 * Applies a raw pointer delta to a handle direction, then clamps to the
 * minimum size by pinning the *opposite* edge in place — shrinking past the
 * minimum while dragging the west handle should stop growing x, not let the
 * window's east edge drift.
 */
export function computeResize(handle: ResizeHandle, base: Rect, dx: number, dy: number): Rect {
  let { x, y, w, h } = base;

  if (handle.includes('e')) w = base.w + dx;
  if (handle.includes('w')) {
    w = base.w - dx;
    x = base.x + dx;
  }
  if (handle.includes('s')) h = base.h + dy;
  if (handle.includes('n')) {
    h = base.h - dy;
    y = base.y + dy;
  }

  if (w < MIN_WIDTH) {
    w = MIN_WIDTH;
    if (handle.includes('w')) x = base.x + base.w - MIN_WIDTH;
  }
  if (h < MIN_HEIGHT) {
    h = MIN_HEIGHT;
    if (handle.includes('n')) y = base.y + base.h - MIN_HEIGHT;
  }

  return { x, y, w, h };
}
