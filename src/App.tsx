import { useEffect } from 'react';
import { useWindowStore } from './stores/windowStore';
import { APP_REGISTRY } from './apps/APP_REGISTRY';
import { initPersistence } from './persistence/persist';
import { Desktop } from './desktop/Desktop/Desktop';
import { WindowManager } from './window-manager/WindowManager/WindowManager';
import { Taskbar } from './taskbar/Taskbar/Taskbar';
import styles from './App.module.css';

export function App(): React.JSX.Element {
  useEffect(() => {
    // Symmetric cleanup matters here: StrictMode mounts effects twice in dev
    // (mount -> cleanup -> mount) specifically to catch non-idempotent setup
    // like this. A seeded demo window is closed again on cleanup, and
    // initPersistence's own cleanup unsubscribes its listeners — so the
    // double-invoke settles into exactly the same state either way.
    const { restored, cleanup } = initPersistence();

    let seededWindowId: string | null = null;
    if (!restored) {
      seededWindowId = useWindowStore
        .getState()
        .openWindow('notepad', APP_REGISTRY.notepad?.defaultSize ?? { w: 380, h: 260 });
    }

    return () => {
      if (seededWindowId !== null) useWindowStore.getState().closeWindow(seededWindowId);
      cleanup();
    };
  }, []);

  return (
    <div className={styles.desktop} data-testid="desktop">
      <Desktop />
      <WindowManager />
      <Taskbar />
    </div>
  );
}
