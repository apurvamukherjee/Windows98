import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePointerDrag, type PointerDragHandlers } from './usePointerDrag';

function DragSurface(props: PointerDragHandlers): React.JSX.Element {
  const { onPointerDown } = usePointerDrag(props);
  return <div data-testid="surface" onPointerDown={onPointerDown} />;
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePointerDrag', () => {
  test('batches move events into a single onDrag call carrying cumulative delta', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    render(<DragSurface onDrag={onDrag} onDragEnd={onDragEnd} />);

    fireEvent.pointerDown(screen.getByTestId('surface'), {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 130, clientY: 90 }));

    expect(onDrag).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(30, -10, 130, 90);

    fireEvent(window, new PointerEvent('pointerup', { clientX: 130, clientY: 90 }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(30, -10, 130, 90);
  });

  test('stops responding to move events after pointerup', () => {
    const onDrag = vi.fn();
    render(<DragSurface onDrag={onDrag} onDragEnd={vi.fn()} />);

    fireEvent.pointerDown(screen.getByTestId('surface'), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointerup', { clientX: 5, clientY: 5 }));
    onDrag.mockClear();

    fireEvent(window, new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(onDrag).not.toHaveBeenCalled();
  });

  test('commits exactly once via blur if the gesture is interrupted mid-drag', () => {
    const onDragEnd = vi.fn();
    render(<DragSurface onDrag={vi.fn()} onDragEnd={onDragEnd} />);

    fireEvent.pointerDown(screen.getByTestId('surface'), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 40, clientY: 10 }));
    fireEvent(window, new Event('blur'));

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(40, 10, 40, 10);
  });

  test('calls onDragStart exactly once per gesture', () => {
    const onDragStart = vi.fn();
    render(<DragSurface onDragStart={onDragStart} onDrag={vi.fn()} onDragEnd={vi.fn()} />);

    fireEvent.pointerDown(screen.getByTestId('surface'), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 10, clientY: 10 }));
    fireEvent(window, new PointerEvent('pointermove', { clientX: 20, clientY: 20 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 20, clientY: 20 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });
});
