import { useEffect, useRef, useState } from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { useTaskbarStore } from '../../stores/taskbarStore';
import { APP_REGISTRY } from '../../apps/APP_REGISTRY';
import { ContextMenu, type ContextMenuItem } from '../../context-menu/ContextMenu/ContextMenu';
import { StartMenu } from '../StartMenu/StartMenu';
import { Clock } from '../Clock/Clock';
import styles from './Taskbar.module.css';

interface MenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function Taskbar(): React.JSX.Element {
  const zOrder = useWindowStore((state) => state.zOrder);
  const windows = useWindowStore((state) => state.windows);
  const focus = useWindowStore((state) => state.focus);
  const minimize = useWindowStore((state) => state.minimize);
  const restoreFromMinimized = useWindowStore((state) => state.restoreFromMinimized);
  const openWindow = useWindowStore((state) => state.openWindow);
  const pinnedAppIds = useTaskbarStore((state) => state.pinnedAppIds);
  const pinApp = useTaskbarStore((state) => state.pinApp);
  const unpinApp = useTaskbarStore((state) => state.unpinApp);

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startMenuOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current?.contains(event.target as Node) === true) return;
      setStartMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [startMenuOpen]);

  const topmostVisibleId = [...zOrder].reverse().find((id) => windows[id]?.minimized === false);
  const runningAppIds = new Set(
    zOrder.map((id) => windows[id]?.appId).filter((appId): appId is string => appId !== undefined),
  );

  const onButtonClick = (id: string): void => {
    const win = windows[id];
    if (win === undefined) return;
    if (win.minimized) {
      restoreFromMinimized(id);
      focus(id);
      return;
    }
    if (id === topmostVisibleId) {
      minimize(id);
      return;
    }
    focus(id);
  };

  const onLaunch = (appId: string): void => {
    const size = APP_REGISTRY[appId]?.defaultSize ?? { w: 380, h: 260 };
    openWindow(appId, size);
    setStartMenuOpen(false);
  };

  const onWindowButtonContextMenu = (appId: string, event: React.MouseEvent): void => {
    event.preventDefault();
    const isPinned = pinnedAppIds.includes(appId);
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar',
          onSelect: () => (isPinned ? unpinApp(appId) : pinApp(appId)),
        },
      ],
    });
  };

  return (
    <div ref={rootRef} className={styles.taskbar}>
      <button
        type="button"
        className={`${styles.startButton} ${startMenuOpen ? styles.active : ''}`}
        onClick={() => setStartMenuOpen((open) => !open)}
      >
        Start
      </button>
      {startMenuOpen && <StartMenu onLaunch={onLaunch} />}
      {pinnedAppIds
        .filter((appId) => !runningAppIds.has(appId))
        .map((appId) => {
          const app = APP_REGISTRY[appId];
          if (app === undefined) return null;
          return (
            <button
              key={`pinned-${appId}`}
              type="button"
              className={styles.button}
              onClick={() => onLaunch(appId)}
              onContextMenu={(event) => onWindowButtonContextMenu(appId, event)}
            >
              {app.icon} {app.title}
            </button>
          );
        })}
      {zOrder.map((id) => {
        const win = windows[id];
        if (win === undefined) return null;
        return (
          <button
            key={id}
            type="button"
            className={`${styles.button} ${id === topmostVisibleId ? styles.active : ''}`}
            onClick={() => onButtonClick(id)}
            onContextMenu={(event) => onWindowButtonContextMenu(win.appId, event)}
          >
            {APP_REGISTRY[win.appId]?.title ?? win.appId}
          </button>
        );
      })}
      <div className={styles.spacer} />
      <Clock />
      {menu !== null && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
