import { beforeEach, describe, expect, test } from 'vitest';
import { useDesktopStore } from './desktopStore';

beforeEach(() => {
  useDesktopStore.setState({ iconPositions: {} });
});

describe('setIconPosition', () => {
  test('stores a position for an id', () => {
    useDesktopStore.getState().setIconPosition('file-0', 80, 90);
    expect(useDesktopStore.getState().iconPositions['file-0']).toEqual({ x: 80, y: 90 });
  });

  test('does not affect other ids by reference', () => {
    useDesktopStore.getState().setIconPosition('a', 0, 0);
    const before = useDesktopStore.getState().iconPositions.a;
    useDesktopStore.getState().setIconPosition('b', 80, 0);
    expect(useDesktopStore.getState().iconPositions.a).toBe(before);
  });
});
