import type { Rect, SnapZone } from '../stores/windowStore';

export const SNAP_EDGE_PX = 24;

export function detectSnapZone(clientX: number, clientY: number, viewportW: number): SnapZone {
  if (clientY <= SNAP_EDGE_PX) return 'top';
  if (clientX <= SNAP_EDGE_PX) return 'left';
  if (clientX >= viewportW - SNAP_EDGE_PX) return 'right';
  return null;
}

export function snapZoneRect(
  zone: Exclude<SnapZone, null>,
  viewportW: number,
  viewportH: number,
  taskbarHeight: number,
): Rect {
  const usableH = viewportH - taskbarHeight;
  const halfW = Math.round(viewportW / 2);

  switch (zone) {
    case 'top':
      return { x: 0, y: 0, w: viewportW, h: usableH };
    case 'left':
      return { x: 0, y: 0, w: halfW, h: usableH };
    case 'right':
      return { x: halfW, y: 0, w: viewportW - halfW, h: usableH };
  }
}
