import { memo, useCallback, useRef, type RefObject } from 'react';
import { useWindowStore, type Rect } from '../../stores/windowStore';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useIsSmallScreen } from '../../hooks/useMediaQuery';
import { computeResize, RESIZE_HANDLES, type ResizeHandle } from '../resizeMath';
import { detectSnapZone, snapZoneRect } from '../snap';
import { TASKBAR_HEIGHT_PX } from '../../layoutConstants';
import { APP_REGISTRY } from '../../apps/APP_REGISTRY';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import type { SnapGhostHandle } from '../SnapGhost/SnapGhost';
import styles from './Window.module.css';

interface WindowProps {
  id: string;
  snapGhostRef: RefObject<SnapGhostHandle | null>;
}

function usableViewport(): { w: number; h: number } {
  return { w: window.innerWidth, h: window.innerHeight - TASKBAR_HEIGHT_PX };
}

function WindowImpl({ id, snapGhostRef }: WindowProps): React.JSX.Element | null {
  const win = useWindowStore((state) => state.windows[id]);
  const moveWindow = useWindowStore((state) => state.moveWindow);
  const resizeWindow = useWindowStore((state) => state.resizeWindow);
  const focus = useWindowStore((state) => state.focus);
  const minimize = useWindowStore((state) => state.minimize);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const snapWindow = useWindowStore((state) => state.snapWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const clearInstanceState = useAppInstanceStore((state) => state.clearInstanceState);

  const isSmallScreen = useIsSmallScreen();

  const rootRef = useRef<HTMLDivElement>(null);
  const gestureBase = useRef<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const activeHandle = useRef<ResizeHandle>('se');
  const pendingSnapZone = useRef<ReturnType<typeof detectSnapZone>>(null);
  const hasRestoredForGesture = useRef(false);

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
      pendingSnapZone.current = null;
      hasRestoredForGesture.current = false;
      // Deliberately NOT restoring a maximized/snapped window here: a plain
      // click (pointerdown+pointerup with zero movement) still fires
      // onDragStart, and restoring on pointerdown alone would shrink the
      // window out from under the second click of an attempted double-click.
      // Restoring only happens once real movement is observed, in onDrag.
      gestureBase.current = { x: win.x, y: win.y, w: win.w, h: win.h };
    },
    onDrag: (dx, dy, clientX, clientY) => {
      if (!hasRestoredForGesture.current && win !== undefined && (win.maximized || win.snapped !== null)) {
        hasRestoredForGesture.current = true;
        restoreWindow(id);
        const restored = useWindowStore.getState().windows[id];
        if (restored !== undefined) {
          gestureBase.current = { x: restored.x, y: restored.y, w: restored.w, h: restored.h };
        }
      }

      const base = gestureBase.current;
      applyTransform(base.x + dx, base.y + dy);

      const zone = detectSnapZone(clientX, clientY, window.innerWidth);
      pendingSnapZone.current = zone;
      const ghost = snapGhostRef.current;
      if (ghost === null) return;
      if (zone === null) {
        ghost.hide();
        return;
      }
      const { w, h } = usableViewport();
      ghost.show(snapZoneRect(zone, w, h + TASKBAR_HEIGHT_PX, TASKBAR_HEIGHT_PX));
    },
    onDragEnd: (dx, dy) => {
      snapGhostRef.current?.hide();
      const zone = pendingSnapZone.current;
      if (zone !== null) {
        const { w, h } = usableViewport();
        snapWindow(id, zone, snapZoneRect(zone, w, h + TASKBAR_HEIGHT_PX, TASKBAR_HEIGHT_PX));
        return;
      }
      if (dx === 0 && dy === 0) return;
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

  const onToggleMaximize = useCallback(() => {
    const current = useWindowStore.getState().windows[id];
    if (current === undefined) return;
    if (current.maximized) {
      restoreWindow(id);
    } else {
      const { w, h } = usableViewport();
      maximizeWindow(id, { x: 0, y: 0, w, h });
    }
  }, [id, maximizeWindow, restoreWindow]);

  if (win === undefined || win.minimized) return null;

  const rect = isSmallScreen ? { x: 0, y: 0, ...usableViewport() } : win;
  const appDef = APP_REGISTRY[win.appId];
  const AppComponent = appDef?.component;

  return (
    <div
      ref={rootRef}
      data-testid={`window-${id}`}
      className={styles.window}
      style={{
        transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
        width: rect.w,
        height: rect.h,
      }}
      onPointerDownCapture={() => focus(id)}
    >
      {/* Rendered first so they paint underneath the titlebar/content —
          resize handles overlap the window's corners and edges, and must
          not steal clicks meant for the titlebar buttons that live there. */}
      {!isSmallScreen &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            data-testid={`resize-${handle}`}
            className={`${styles.handle} ${styles[`handle-${handle}`]}`}
            onPointerDown={onHandlePointerDown(handle)}
          />
        ))}
      <div
        data-testid={`titlebar-${id}`}
        className={styles.titlebar}
        onPointerDown={isSmallScreen ? undefined : dragHandlers.onPointerDown}
        onDoubleClick={isSmallScreen ? undefined : onToggleMaximize}
      >
        <span className={styles.title}>{appDef?.title ?? win.appId}</span>
        {/* stopPropagation so a pointerdown on these buttons never bubbles
            into the titlebar's own onPointerDown — otherwise setPointerCapture
            there redirects the resulting click away from the button entirely. */}
        <div className={styles.titlebarButtons} onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label="Minimize"
            className={styles.chromeButton}
            onClick={() => minimize(id)}
          >
            &#x2500;
          </button>
          {!isSmallScreen && (
            <button
              type="button"
              aria-label={win.maximized ? 'Restore' : 'Maximize'}
              className={styles.chromeButton}
              onClick={onToggleMaximize}
            >
              {win.maximized ? '❐' : '□'}
            </button>
          )}
          <button
            type="button"
            aria-label="Close"
            className={styles.chromeButton}
            onClick={() => {
              closeWindow(id);
              clearInstanceState(id);
            }}
          >
            &#x2715;
          </button>
        </div>
      </div>
      <div className={styles.content}>{AppComponent !== undefined && <AppComponent windowId={id} />}</div>
    </div>
  );
}

export const Window = memo(WindowImpl);
