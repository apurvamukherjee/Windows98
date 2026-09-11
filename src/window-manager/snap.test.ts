import { describe, expect, test } from 'vitest';
import { detectSnapZone, SNAP_EDGE_PX, snapZoneRect } from './snap';

const VIEWPORT_W = 1000;
const VIEWPORT_H = 700;
const TASKBAR = 28;

describe('detectSnapZone', () => {
  test('returns top when near the top edge, taking priority over left/right', () => {
    expect(detectSnapZone(0, SNAP_EDGE_PX - 1, VIEWPORT_W)).toBe('top');
    expect(detectSnapZone(VIEWPORT_W - 1, SNAP_EDGE_PX - 1, VIEWPORT_W)).toBe('top');
  });

  test('returns left when near the left edge', () => {
    expect(detectSnapZone(SNAP_EDGE_PX - 1, 400, VIEWPORT_W)).toBe('left');
  });

  test('returns right when near the right edge', () => {
    expect(detectSnapZone(VIEWPORT_W - SNAP_EDGE_PX + 1, 400, VIEWPORT_W)).toBe('right');
  });

  test('returns null away from every edge', () => {
    expect(detectSnapZone(500, 400, VIEWPORT_W)).toBeNull();
  });

  test('is exclusive right at the threshold boundary', () => {
    expect(detectSnapZone(SNAP_EDGE_PX + 1, 400, VIEWPORT_W)).toBeNull();
  });
});

describe('snapZoneRect', () => {
  test('top fills the full usable viewport (minus the taskbar)', () => {
    expect(snapZoneRect('top', VIEWPORT_W, VIEWPORT_H, TASKBAR)).toEqual({
      x: 0,
      y: 0,
      w: VIEWPORT_W,
      h: VIEWPORT_H - TASKBAR,
    });
  });

  test('left and right split the viewport exactly with no gap or overlap', () => {
    const left = snapZoneRect('left', VIEWPORT_W, VIEWPORT_H, TASKBAR);
    const right = snapZoneRect('right', VIEWPORT_W, VIEWPORT_H, TASKBAR);

    expect(left.x).toBe(0);
    expect(left.x + left.w).toBe(right.x);
    expect(right.x + right.w).toBe(VIEWPORT_W);
    expect(left.h).toBe(VIEWPORT_H - TASKBAR);
    expect(right.h).toBe(VIEWPORT_H - TASKBAR);
  });
});
