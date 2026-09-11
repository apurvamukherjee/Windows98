import { useEasterEggStore } from '../../stores/easterEggStore';
import styles from './ErrorDialogCascade.module.css';

/**
 * Renders every open cascade dialog. Each one that's closed spawns up to
 * two more (capped in the store) — a joke about the classic Windows error
 * spam, not a real freeze.
 */
export function ErrorDialogCascade(): React.JSX.Element {
  const dialogs = useEasterEggStore((state) => state.errorDialogs);
  const closeErrorDialog = useEasterEggStore((state) => state.closeErrorDialog);

  return (
    <>
      {dialogs.map((dialog) => (
        <div
          key={dialog.id}
          className={styles.dialog}
          role="alertdialog"
          aria-label="Error"
          style={{ left: `${dialog.x}%`, top: `${dialog.y}%` }}
        >
          <div className={styles.titlebar}>
            <span>Error</span>
          </div>
          <div className={styles.body}>
            <span className={styles.icon} aria-hidden="true">
              ⛔
            </span>
            <span>{dialog.message}</span>
          </div>
          <div className={styles.buttons}>
            <button type="button" onClick={() => closeErrorDialog(dialog.id)}>
              OK
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
