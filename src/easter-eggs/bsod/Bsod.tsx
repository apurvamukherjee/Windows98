import { useState } from 'react';
import { BootScreen } from '../../boot/BootScreen/BootScreen';
import styles from './Bsod.module.css';

interface BsodProps {
  onDismiss: () => void;
}

export function Bsod({ onDismiss }: BsodProps): React.JSX.Element {
  const [rebooting, setRebooting] = useState(false);

  if (rebooting) return <BootScreen onDismiss={onDismiss} />;

  return (
    <div
      className={styles.screen}
      onClick={() => setRebooting(true)}
      onKeyDown={() => setRebooting(true)}
      role="button"
      tabIndex={0}
      aria-label="Simulated crash screen, press any key to reboot"
    >
      <span className={styles.banner}>Windows98.app</span>
      <p className={styles.line}>A fatal exception has occurred at nowhere:in particular.</p>
      <p className={styles.line}>The current operation was aborted so nothing was actually lost.</p>
      <p className={styles.line}>* Press any key to reboot Windows98.app.</p>
      <p className={styles.line}>* This is a nostalgia gag, not a real crash — your open windows are untouched.</p>
      <p className={styles.hint}>_</p>
    </div>
  );
}
