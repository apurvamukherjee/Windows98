import { useEffect, useState } from 'react';
import { useWindowStore } from './stores/windowStore';
import { useDesktopStore } from './stores/desktopStore';
import { useEasterEggStore } from './stores/easterEggStore';
import { APP_REGISTRY } from './apps/APP_REGISTRY';
import { initPersistence } from './persistence/persist';
import { BootScreen } from './boot/BootScreen/BootScreen';
import { Desktop } from './desktop/Desktop/Desktop';
import { WindowManager } from './window-manager/WindowManager/WindowManager';
import { Taskbar } from './taskbar/Taskbar/Taskbar';
import { KonamiEffect } from './easter-eggs/KonamiEffect/KonamiEffect';
import { Bsod } from './easter-eggs/bsod/Bsod';
import styles from './App.module.css';

const BOOT_DURATION_MS = 1400;

export function App(): React.JSX.Element {
  const wallpaper = useDesktopStore((state) => state.wallpaper);
  const bsodActive = useEasterEggStore((state) => state.bsodActive);
  const dismissBsod = useEasterEggStore((state) => state.dismissBsod);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setBooting(false), reduceMotion ? 0 : BOOT_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

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
    <div className={styles.desktop} data-testid="desktop" style={{ background: wallpaper }}>
      <Desktop />
      <WindowManager />
      <Taskbar />
      <KonamiEffect />
      {booting && <BootScreen onDismiss={() => setBooting(false)} />}
      {bsodActive && <Bsod onDismiss={dismissBsod} />}
    </div>
  );
}
