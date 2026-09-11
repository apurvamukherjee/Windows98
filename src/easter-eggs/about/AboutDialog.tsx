import { useRef, useState } from 'react';
import styles from './AboutDialog.module.css';

interface AboutDialogProps {
  onClose: () => void;
}

const CLICKS_TO_UNLOCK = 10;
const CLICK_RESET_GAP_MS = 800;

const CREDITS = [
  'Windows98.app',
  '',
  'A from-scratch simulation of a desktop OS,',
  'running entirely in the browser.',
  '',
  'Real drag & resize physics.',
  'A real window manager.',
  'A real (virtual) file system,',
  'shared live across every app.',
  '',
  'Built by Apurva Mukherjee.',
  '',
  'Thanks for clicking the logo.',
];

export function AboutDialog({ onClose }: AboutDialogProps): React.JSX.Element {
  const [clickCount, setClickCount] = useState(0);
  const lastClickRef = useRef(0);
  const unlocked = clickCount >= CLICKS_TO_UNLOCK;

  const onLogoClick = (): void => {
    if (unlocked) return;
    const now = Date.now();
    const withinWindow = now - lastClickRef.current <= CLICK_RESET_GAP_MS;
    lastClickRef.current = now;
    setClickCount((count) => (withinWindow ? count + 1 : 1));
  };

  return (
    // stopPropagation on pointerdown, not just click: this dialog is rendered
    // inside Desktop's own tree, whose background pointerdown handler calls
    // setPointerCapture for rubber-band select — left unstopped, that capture
    // retargets the browser's click synthesis away from any button in here,
    // so no click inside the dialog would ever register (see ContextMenu for
    // the same fix, needed for the same reason).
    <div className={styles.overlay} onClick={onClose} onPointerDown={(event) => event.stopPropagation()}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-label="About Windows98.app"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.titlebar}>
          <span>About Windows98.app</span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.body}>
          <button type="button" className={styles.logo} onClick={onLogoClick} aria-label="Windows98.app logo">
            🪟
          </button>
          <p className={styles.appName}>Windows98.app</p>
          <p className={styles.version}>Version 1.0 — a portfolio project</p>
          <p className={styles.hint}>{unlocked ? '' : 'Click the logo.'}</p>
          {unlocked && (
            <div className={styles.reel}>
              <div className={styles.reelTrack}>
                {CREDITS.map((line, index) => (
                  <p key={index}>{line || ' '}</p>
                ))}
              </div>
            </div>
          )}
          <div className={styles.buttons}>
            <button type="button" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
