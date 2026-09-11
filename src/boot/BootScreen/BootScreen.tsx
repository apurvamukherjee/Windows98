import styles from './BootScreen.module.css';

interface BootScreenProps {
  onDismiss: () => void;
}

export function BootScreen({ onDismiss }: BootScreenProps): React.JSX.Element {
  return (
    <div
      className={styles.screen}
      onClick={onDismiss}
      onKeyDown={onDismiss}
      role="button"
      tabIndex={0}
      aria-label="Skip boot screen"
    >
      <span className={styles.wordmark}>Windows98.app</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} />
      </div>
      <span className={styles.subtitle}>Starting up…</span>
      <span className={styles.hint}>(click to skip)</span>
    </div>
  );
}
