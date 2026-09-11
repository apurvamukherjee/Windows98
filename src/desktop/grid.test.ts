import { describe, expect, test } from 'vitest';
import { assignDefaultPositions, ICON_CELL_H, ICON_CELL_W, snapToGrid } from './grid';

describe('snapToGrid', () => {
  test('rounds to the nearest cell', () => {
    expect(snapToGrid(35, 40)).toEqual({ x: 0, y: 0 });
    expect(snapToGrid(50, 50)).toEqual({ x: ICON_CELL_W, y: ICON_CELL_H });
  });

  test('clamps negative coordinates to 0', () => {
    expect(snapToGrid(-20, -30)).toEqual({ x: 0, y: 0 });
  });
});

describe('assignDefaultPositions', () => {
  test('leaves already-positioned ids untouched', () => {
    const result = assignDefaultPositions(['a'], { a: { x: 240, y: 180 } });
    expect(result.a).toBeUndefined();
  });

  test('assigns the first free column-major cell to an unpositioned id', () => {
    const result = assignDefaultPositions(['a'], {});
    expect(result.a).toEqual({ x: 0, y: 0 });
  });

  test('skips cells already occupied by positioned icons', () => {
    const result = assignDefaultPositions(['a'], { existing: { x: 0, y: 0 } });
    expect(result.a).toEqual({ x: 0, y: ICON_CELL_H });
  });

  test('assigns distinct cells to multiple unpositioned ids in order', () => {
    const result = assignDefaultPositions(['a', 'b'], {});
    expect(result.a).toEqual({ x: 0, y: 0 });
    expect(result.b).toEqual({ x: 0, y: ICON_CELL_H });
  });
});
