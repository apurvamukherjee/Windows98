import { useCallback, useRef } from 'react';
import { useWindowStore, type Rect } from '../../stores/windowStore';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { computeResize, RESIZE_HANDLES, type ResizeHandle } from '../resizeMath';
import styles from './Window.module.css';

interface WindowProps {
  id: string;
}

export function Window({ id }: WindowProps): React.JSX.Element | null {
  const win = useWindowStore((state) => state.windows[id]);
  const moveWindow = useWindowStore((state) => state.moveWindow);
  const resizeWindow = useWindowStore((state) => state.resizeWindow);

  const rootRef = useRef<HTMLDivElement>(null);
  const gestureBase = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const activeHandle = useRef<ResizeHandle>('se');

  const applyTransform = useCallback((x: number, y: number) => {
    const node = rootRef.current;
    if (node === null) return;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const applyRect = useCallback((rect: Rect) => {
    const node = rootRef.current;
    if (node === null) return;
    node.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
    node.style.width = `${rect.w}px`;
    node.style.height = `${rect.h}px`;
  }, []);

  const dragHandlers = usePointerDrag({
    onDragStart: () => {
      if (win === undefined) return;
      gestureBase.current = { x: win.x, y: win.y, w: win.w, h: win.h };
    },
    onDrag: (dx, dy) => {
      const base = gestureBase.current;
      applyTransform(base.x + dx, base.y + dy);
    },
    onDragEnd: (dx, dy) => {
      const base = gestureBase.current;
      moveWindow(id, base.x + dx, base.y + dy);
    },
  });

  const resizeHandlers = usePointerDrag({
    onDragStart: () => {
      if (win === undefined) return;
      gestureBase.current = { x: win.x, y: win.y, w: win.w, h: win.h };
    },
    onDrag: (dx, dy) => {
      applyRect(computeResize(activeHandle.current, gestureBase.current, dx, dy));
    },
    onDragEnd: (dx, dy) => {
      resizeWindow(id, computeResize(activeHandle.current, gestureBase.current, dx, dy));
    },
  });

  const onHandlePointerDown = useCallback(
    (handle: ResizeHandle) => (event: React.PointerEvent) => {
      activeHandle.current = handle;
      resizeHandlers.onPointerDown(event);
    },
    [resizeHandlers],
  );

  if (win === undefined) return null;

  return (
    <div
      ref={rootRef}
      className={styles.window}
      style={{ transform: `translate3d(${win.x}px, ${win.y}px, 0)`, width: win.w, height: win.h }}
    >
      <div className={styles.titlebar} onPointerDown={dragHandlers.onPointerDown}>
        <span className={styles.title}>{win.appId}</span>
      </div>
      <div className={styles.content} />
      {RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          data-testid={`resize-${handle}`}
          className={`${styles.handle} ${styles[`handle-${handle}`]}`}
          onPointerDown={onHandlePointerDown(handle)}
        />
      ))}
    </div>
  );
}
