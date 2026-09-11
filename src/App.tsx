import { useEffect } from 'react';
import { useWindowStore } from './stores/windowStore';
import { APP_REGISTRY } from './apps/APP_REGISTRY';
import { WindowManager } from './window-manager/WindowManager/WindowManager';
import { Taskbar } from './taskbar/Taskbar/Taskbar';
import styles from './App.module.css';

export function App(): React.JSX.Element {
  useEffect(() => {
    // Symmetric cleanup matters here: StrictMode mounts effects twice in dev
    // (mount -> cleanup -> mount) specifically to catch non-idempotent setup
    // like this. Without closing the window on cleanup, that double-invoke
    // would leave two Notepad windows open in dev but only one in prod.
    const id = useWindowStore
      .getState()
      .openWindow('notepad', APP_REGISTRY.notepad?.defaultSize ?? { w: 380, h: 260 });
    return () => {
      useWindowStore.getState().closeWindow(id);
    };
  }, []);

  return (
    <div className={styles.desktop} data-testid="desktop">
      <WindowManager />
      <Taskbar />
    </div>
  );
}
