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
    restoreRect: null,
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
    nextWindowSeq: 0,
  });
});

describe('openWindow', () => {
  test('creates a window with a fresh id, the given size, and focuses it', () => {
    const id = useWindowStore.getState().openWindow('notepad', { w: 380, h: 260 });

    const state = useWindowStore.getState();
    expect(state.windows[id]).toMatchObject({ appId: 'notepad', w: 380, h: 260, minimized: false });
    expect(state.zOrder.at(-1)).toBe(id);
  });

  test('assigns a distinct id to each call, even for the same app', () => {
    const idA = useWindowStore.getState().openWindow('notepad', { w: 380, h: 260 });
    const idB = useWindowStore.getState().openWindow('notepad', { w: 380, h: 260 });

    expect(idA).not.toBe(idB);
    expect(useWindowStore.getState().windows[idA]).toBeDefined();
    expect(useWindowStore.getState().windows[idB]).toBeDefined();
  });
});

describe('moveWindow', () => {
  test('updates only the target window and preserves other windows by reference', () => {
    const before = useWindowStore.getState().windows;

    useWindowStore.getState().moveWindow('a', 10, 20);

    const after = useWindowStore.getState().windows;
    expect(after.a).not.toBe(before.a);
    expect(after.a).toMatchObject({ x: 10, y: 20 });
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

describe('focus', () => {
  test('moves the target id to the end of zOrder', () => {
    useWindowStore.getState().focus('a');
    expect(useWindowStore.getState().zOrder).toEqual(['b', 'a']);
  });

  test('is a no-op (same reference) when already topmost', () => {
    const before = useWindowStore.getState();
    useWindowStore.getState().focus('b');
    expect(useWindowStore.getState()).toBe(before);
  });

  test('is a no-op for an unknown id', () => {
    const before = useWindowStore.getState();
    useWindowStore.getState().focus('missing');
    expect(useWindowStore.getState()).toBe(before);
  });
});

describe('cycleFocus', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: { a: seedWindow('a'), b: seedWindow('b'), c: seedWindow('c') },
      zOrder: ['a', 'b', 'c'],
    });
  });

  test('direction -1 rotates the previous top to the front, shifting the others back', () => {
    useWindowStore.getState().cycleFocus(-1);
    expect(useWindowStore.getState().zOrder).toEqual(['c', 'a', 'b']);
  });

  test('direction 1 is the exact inverse rotation', () => {
    useWindowStore.getState().cycleFocus(-1);
    useWindowStore.getState().cycleFocus(1);
    expect(useWindowStore.getState().zOrder).toEqual(['a', 'b', 'c']);
  });

  test('direction 1 alone cycles the other way', () => {
    useWindowStore.getState().cycleFocus(1);
    expect(useWindowStore.getState().zOrder).toEqual(['b', 'c', 'a']);
  });

  test('repeated calls cycle through every window and back', () => {
    useWindowStore.getState().cycleFocus(-1);
    useWindowStore.getState().cycleFocus(-1);
    useWindowStore.getState().cycleFocus(-1);
    expect(useWindowStore.getState().zOrder).toEqual(['a', 'b', 'c']);
  });

  test('skips minimized windows', () => {
    useWindowStore.getState().minimize('b');
    useWindowStore.getState().cycleFocus(-1);
    // only 'a' and 'c' are visible; cycling brings 'a' to the front.
    expect(useWindowStore.getState().zOrder.at(-1)).toBe('a');
  });

  test('is a no-op with zero or one visible windows', () => {
    useWindowStore.getState().minimize('a');
    useWindowStore.getState().minimize('b');
    const before = useWindowStore.getState();
    useWindowStore.getState().cycleFocus(-1);
    expect(useWindowStore.getState()).toBe(before);
  });
});

describe('minimize / restoreFromMinimized', () => {
  test('minimize sets the flag and restoreFromMinimized clears it', () => {
    useWindowStore.getState().minimize('a');
    expect(useWindowStore.getState().windows.a).toMatchObject({ minimized: true });

    useWindowStore.getState().restoreFromMinimized('a');
    expect(useWindowStore.getState().windows.a).toMatchObject({ minimized: false });
  });

  test('minimize is idempotent (same reference) when already minimized', () => {
    useWindowStore.getState().minimize('a');
    const before = useWindowStore.getState();
    useWindowStore.getState().minimize('a');
    expect(useWindowStore.getState()).toBe(before);
  });
});

describe('maximizeWindow / restoreWindow', () => {
  test('maximize snapshots the floating rect and applies the given rect', () => {
    useWindowStore.getState().maximizeWindow('a', { x: 0, y: 0, w: 1000, h: 700 });

    const win = useWindowStore.getState().windows.a;
    expect(win).toMatchObject({ maximized: true, x: 0, y: 0, w: 1000, h: 700 });
    expect(win?.restoreRect).toEqual({ x: 0, y: 0, w: 300, h: 200 });
  });

  test('restoreWindow returns to the pre-maximize rect', () => {
    useWindowStore.getState().maximizeWindow('a', { x: 0, y: 0, w: 1000, h: 700 });
    useWindowStore.getState().restoreWindow('a');

    const win = useWindowStore.getState().windows.a;
    expect(win).toMatchObject({ maximized: false, x: 0, y: 0, w: 300, h: 200 });
    expect(win?.restoreRect).toBeNull();
  });

  test('restoreWindow is a no-op for a plain floating window', () => {
    const before = useWindowStore.getState();
    useWindowStore.getState().restoreWindow('a');
    expect(useWindowStore.getState()).toBe(before);
  });
});

describe('snapWindow', () => {
  test('snaps and remembers the original floating rect', () => {
    useWindowStore.getState().snapWindow('a', 'left', { x: 0, y: 0, w: 500, h: 700 });

    const win = useWindowStore.getState().windows.a;
    expect(win).toMatchObject({ snapped: 'left', x: 0, y: 0, w: 500, h: 700 });
    expect(win?.restoreRect).toEqual({ x: 0, y: 0, w: 300, h: 200 });
  });

  test('re-snapping to a different zone keeps the original floating rect, not the previous snap rect', () => {
    useWindowStore.getState().snapWindow('a', 'left', { x: 0, y: 0, w: 500, h: 700 });
    useWindowStore.getState().snapWindow('a', 'right', { x: 500, y: 0, w: 500, h: 700 });

    const win = useWindowStore.getState().windows.a;
    expect(win).toMatchObject({ snapped: 'right' });
    expect(win?.restoreRect).toEqual({ x: 0, y: 0, w: 300, h: 200 });
  });

  test('restoreWindow un-snaps back to the floating rect', () => {
    useWindowStore.getState().snapWindow('a', 'left', { x: 0, y: 0, w: 500, h: 700 });
    useWindowStore.getState().restoreWindow('a');

    const win = useWindowStore.getState().windows.a;
    expect(win).toMatchObject({ snapped: null, x: 0, y: 0, w: 300, h: 200 });
  });
});

describe('closeWindow', () => {
  test('removes the window from both windows and zOrder', () => {
    useWindowStore.getState().closeWindow('a');

    const state = useWindowStore.getState();
    expect(state.windows.a).toBeUndefined();
    expect(state.zOrder).toEqual(['b']);
    expect(state.windows.b).toBeDefined();
  });

  test('is a no-op for an unknown id', () => {
    const before = useWindowStore.getState();
    useWindowStore.getState().closeWindow('missing');
    expect(useWindowStore.getState()).toBe(before);
  });
});
