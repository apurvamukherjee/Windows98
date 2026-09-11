import styles from './Clock.module.css';

interface DateTimeDialogProps {
  now: Date;
  onClose: () => void;
}

export function DateTimeDialog({ now, onClose }: DateTimeDialogProps): React.JSX.Element {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-label="Date/Time Properties"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.titlebar}>
          <span>Date/Time Properties</span>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.row}>
            <span>Date:</span>
            <strong>{now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </div>
          <div className={styles.row}>
            <span>Time:</span>
            <strong>{now.toLocaleTimeString()}</strong>
          </div>
          <p className={styles.note}>Windows98.app runs on your system clock — there&apos;s nothing to set here.</p>
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={onClose}>
            OK
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
