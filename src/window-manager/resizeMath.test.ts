import { describe, expect, test } from 'vitest';
import { computeResize, MIN_HEIGHT, MIN_WIDTH } from './resizeMath';
import type { Rect } from '../stores/windowStore';

const base: Rect = { x: 100, y: 100, w: 300, h: 200 };

describe('computeResize', () => {
  test('e handle grows width only', () => {
    expect(computeResize('e', base, 50, 999)).toEqual({ x: 100, y: 100, w: 350, h: 200 });
  });

  test('s handle grows height only', () => {
    expect(computeResize('s', base, 999, 40)).toEqual({ x: 100, y: 100, w: 300, h: 240 });
  });

  test('w handle grows width and moves x, keeping the east edge fixed', () => {
    const result = computeResize('w', base, -50, 0);
    expect(result).toEqual({ x: 50, y: 100, w: 350, h: 200 });
    expect(result.x + result.w).toBe(base.x + base.w);
  });

  test('n handle grows height and moves y, keeping the south edge fixed', () => {
    const result = computeResize('n', base, 0, -30);
    expect(result).toEqual({ x: 100, y: 70, w: 300, h: 230 });
    expect(result.y + result.h).toBe(base.y + base.h);
  });

  test('se handle grows both dimensions from the fixed nw corner', () => {
    expect(computeResize('se', base, 20, 30)).toEqual({ x: 100, y: 100, w: 320, h: 230 });
  });

  test('clamps width to MIN_WIDTH and pins the east edge when shrinking via w', () => {
    const result = computeResize('w', base, 250, 0);
    expect(result.w).toBe(MIN_WIDTH);
    expect(result.x + result.w).toBe(base.x + base.w);
  });

  test('clamps width to MIN_WIDTH without moving x when shrinking via e', () => {
    const result = computeResize('e', base, -290, 0);
    expect(result.w).toBe(MIN_WIDTH);
    expect(result.x).toBe(base.x);
  });

  test('clamps height to MIN_HEIGHT and pins the south edge when shrinking via n', () => {
    const result = computeResize('n', base, 0, 190);
    expect(result.h).toBe(MIN_HEIGHT);
    expect(result.y + result.h).toBe(base.y + base.h);
  });
});
