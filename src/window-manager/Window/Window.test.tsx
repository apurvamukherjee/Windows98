import { Profiler } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Window } from './Window';
import { useWindowStore, type WindowState } from '../../stores/windowStore';
import type { SnapGhostHandle } from '../SnapGhost/SnapGhost';

const noGhost = { current: null } as unknown as React.RefObject<SnapGhostHandle | null>;

function seed(id: string, overrides: Partial<WindowState> = {}): WindowState {
  return {
    id,
    appId: id,
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
    windows: { a: seed('a'), b: seed('b', { x: 400 }) },
    zOrder: ['a', 'b'],
  });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dragging', () => {
  test('moving window A never re-renders window B, and commits to the store exactly once on release', () => {
    const rendersA = vi.fn();
    const rendersB = vi.fn();

    render(
      <>
        <Profiler id="a" onRender={rendersA}>
          <Window id="a" snapGhostRef={noGhost} />
        </Profiler>
        <Profiler id="b" onRender={rendersB}>
          <Window id="b" snapGhostRef={noGhost} />
        </Profiler>
      </>,
    );

    expect(rendersA).toHaveBeenCalledTimes(1);
    expect(rendersB).toHaveBeenCalledTimes(1);

    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    // Coordinates deliberately away from every screen edge so this exercises
    // a plain move, not a snap (snap behavior is covered separately below).
    fireEvent.pointerDown(titlebarA, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 150, clientY: 120 }));
    fireEvent(window, new PointerEvent('pointermove', { clientX: 155, clientY: 122 }));

    // Mid-gesture: only a ref-driven DOM mutation happened, no store write yet.
    expect(rendersA).toHaveBeenCalledTimes(1);
    expect(rendersB).toHaveBeenCalledTimes(1);

    fireEvent(window, new PointerEvent('pointerup', { clientX: 155, clientY: 122 }));

    expect(rendersA).toHaveBeenCalledTimes(2);
    expect(rendersB).toHaveBeenCalledTimes(1);
    expect(useWindowStore.getState().windows.a).toMatchObject({ x: 155, y: 122, snapped: null });
  });

  test('focuses the window on pointerdown, before the drag gesture starts', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    fireEvent.pointerDown(titlebarA, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointerup', { clientX: 0, clientY: 0 }));

    expect(useWindowStore.getState().zOrder).toEqual(['b', 'a']);
  });

  test('dragging into the left edge snaps instead of moving', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    fireEvent.pointerDown(titlebarA, { clientX: 200, clientY: 200, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 10, clientY: 300 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 10, clientY: 300 }));

    const result = useWindowStore.getState().windows.a;
    expect(result).toMatchObject({ snapped: 'left', x: 0, y: 0 });
    expect(result?.restoreRect).toEqual({ x: 0, y: 0, w: 300, h: 200 });
  });

  test('dragging a maximized window pops it back to its floating size first', () => {
    useWindowStore.getState().maximizeWindow('a', { x: 0, y: 0, w: 1024, h: 740 });
    render(<Window id="a" snapGhostRef={noGhost} />);
    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    fireEvent.pointerDown(titlebarA, { clientX: 300, clientY: 300, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 320, clientY: 320 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 320, clientY: 320 }));

    const result = useWindowStore.getState().windows.a;
    expect(result).toMatchObject({ maximized: false, w: 300, h: 200 });
  });
});

describe('resizing', () => {
  test('dragging the se handle grows width and height and commits once on release', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    const handle = screen.getByTestId('resize-se');

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 40, clientY: 25 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 40, clientY: 25 }));

    expect(useWindowStore.getState().windows.a).toMatchObject({ x: 0, y: 0, w: 340, h: 225 });
  });

  test('dragging the nw handle past the minimum size pins the opposite corner', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    const handle = screen.getByTestId('resize-nw');

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 280, clientY: 190 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 280, clientY: 190 }));

    const result = useWindowStore.getState().windows.a;
    if (result === undefined) throw new Error('window a missing from store');
    expect(result.w).toBe(200);
    expect(result.h).toBe(150);
    expect(result.x + result.w).toBe(300);
    expect(result.y + result.h).toBe(200);
  });
});

describe('titlebar chrome', () => {
  test('minimize button minimizes the window', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(useWindowStore.getState().windows.a).toMatchObject({ minimized: true });
  });

  test('maximize button maximizes, and becomes a restore button', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }));

    expect(useWindowStore.getState().windows.a).toMatchObject({ maximized: true });
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });

  test('double-clicking the titlebar toggles maximize', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    fireEvent.doubleClick(titlebarA);
    expect(useWindowStore.getState().windows.a).toMatchObject({ maximized: true });

    fireEvent.doubleClick(titlebarA);
    expect(useWindowStore.getState().windows.a).toMatchObject({ maximized: false, w: 300, h: 200 });
  });

  test('close button removes the window from the store', () => {
    render(<Window id="a" snapGhostRef={noGhost} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useWindowStore.getState().windows.a).toBeUndefined();
  });

  test('a minimized window renders nothing', () => {
    useWindowStore.getState().minimize('a');
    render(<Window id="a" snapGhostRef={noGhost} />);
    expect(screen.queryByText('a')).not.toBeInTheDocument();
  });
});

describe('small screen fork', () => {
  test('hides resize handles, the maximize button, and disables titlebar drag', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(<Window id="a" snapGhostRef={noGhost} />);

    expect(screen.queryByTestId('resize-se')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument();

    const titlebarA = screen.getByText('a').parentElement;
    expect(titlebarA?.getAttribute('onpointerdown')).toBeNull();
  });
});
