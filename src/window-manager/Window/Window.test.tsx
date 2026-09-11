import { Profiler } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Window } from './Window';
import { useWindowStore, type WindowState } from '../../stores/windowStore';

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
          <Window id="a" />
        </Profiler>
        <Profiler id="b" onRender={rendersB}>
          <Window id="b" />
        </Profiler>
      </>,
    );

    expect(rendersA).toHaveBeenCalledTimes(1);
    expect(rendersB).toHaveBeenCalledTimes(1);

    const titlebarA = screen.getByText('a').parentElement;
    if (titlebarA === null) throw new Error('titlebar not found');

    fireEvent.pointerDown(titlebarA, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 50, clientY: 20 }));
    fireEvent(window, new PointerEvent('pointermove', { clientX: 55, clientY: 22 }));

    // Mid-gesture: only a ref-driven DOM mutation happened, no store write yet.
    expect(rendersA).toHaveBeenCalledTimes(1);
    expect(rendersB).toHaveBeenCalledTimes(1);

    fireEvent(window, new PointerEvent('pointerup', { clientX: 55, clientY: 22 }));

    expect(rendersA).toHaveBeenCalledTimes(2);
    expect(rendersB).toHaveBeenCalledTimes(1);
    expect(useWindowStore.getState().windows.a).toMatchObject({ x: 55, y: 22 });
  });
});

describe('resizing', () => {
  test('dragging the se handle grows width and height and commits once on release', () => {
    render(<Window id="a" />);
    const handle = screen.getByTestId('resize-se');

    fireEvent.pointerDown(handle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 40, clientY: 25 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 40, clientY: 25 }));

    expect(useWindowStore.getState().windows.a).toMatchObject({ x: 0, y: 0, w: 340, h: 225 });
  });

  test('dragging the nw handle past the minimum size pins the opposite corner', () => {
    render(<Window id="a" />);
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
