import { useEffect, useRef, useState } from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { APP_REGISTRY } from '../../apps/APP_REGISTRY';
import { StartMenu } from '../StartMenu/StartMenu';
import styles from './Taskbar.module.css';

export function Taskbar(): React.JSX.Element {
  const zOrder = useWindowStore((state) => state.zOrder);
  const windows = useWindowStore((state) => state.windows);
  const focus = useWindowStore((state) => state.focus);
  const minimize = useWindowStore((state) => state.minimize);
  const restoreFromMinimized = useWindowStore((state) => state.restoreFromMinimized);
  const openWindow = useWindowStore((state) => state.openWindow);

  const [startMenuOpen, setStartMenuOpen] = useState(false);
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
      {zOrder.map((id) => {
        const win = windows[id];
        if (win === undefined) return null;
        return (
          <button
            key={id}
            type="button"
            className={`${styles.button} ${id === topmostVisibleId ? styles.active : ''}`}
            onClick={() => onButtonClick(id)}
          >
            {APP_REGISTRY[win.appId]?.title ?? win.appId}
          </button>
        );
      })}
    </div>
  );
}
