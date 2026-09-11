import { beforeEach, describe, expect, test } from 'vitest';
import { useWindowStore, type WindowState } from './windowStore';

function seedWindow(id: string, overrides: Partial<WindowState> = {}): WindowState {
  return {
    id,
    appId: 'stub',
    x: 0,
    y: 0,
    w: 300,
    h: 200,
    minimized: false,
    maximized: false,
    snapped: null,
    ...overrides,
  };
}

beforeEach(() => {
  useWindowStore.setState({
    windows: {
      a: seedWindow('a'),
      b: seedWindow('b', { x: 400 }),
    },
    zOrder: ['a', 'b'],
  });
});

describe('moveWindow', () => {
  test('updates only the target window and preserves other windows by reference', () => {
    const before = useWindowStore.getState().windows;

    useWindowStore.getState().moveWindow('a', 10, 20);

    const after = useWindowStore.getState().windows;
    expect(after.a).not.toBe(before.a);
    expect(after.a).toMatchObject({ x: 10, y: 20 });
    // The invariant that makes selector-scoped subscriptions skip unrelated
    // windows: an untouched window's object reference must not change.
    expect(after.b).toBe(before.b);
  });

  test('is a no-op for an unknown id', () => {
    const before = useWindowStore.getState();
    useWindowStore.getState().moveWindow('missing', 1, 1);
    expect(useWindowStore.getState()).toBe(before);
  });
});

describe('resizeWindow', () => {
  test('updates the rect of the target window and preserves other windows by reference', () => {
    const before = useWindowStore.getState().windows;

    useWindowStore.getState().resizeWindow('b', { x: 400, y: 0, w: 500, h: 350 });

    const after = useWindowStore.getState().windows;
    expect(after.b).not.toBe(before.b);
    expect(after.b).toMatchObject({ w: 500, h: 350 });
    expect(after.a).toBe(before.a);
  });
});
