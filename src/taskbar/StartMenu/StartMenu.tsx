import { APP_REGISTRY } from '../../apps/APP_REGISTRY';
import { resetPersistedState } from '../../persistence/persist';
import styles from './StartMenu.module.css';

interface StartMenuProps {
  onLaunch: (appId: string) => void;
}

export function StartMenu({ onLaunch }: StartMenuProps): React.JSX.Element {
  return (
    <div className={styles.menu} role="menu">
      {Object.values(APP_REGISTRY).map((app) => (
        <button
          key={app.id}
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={() => onLaunch(app.id)}
        >
          <span aria-hidden="true">{app.icon}</span>
          {app.title}
        </button>
      ))}
      <div className={styles.separator} />
      <button
        type="button"
        role="menuitem"
        className={styles.item}
        onClick={() => {
          if (window.confirm('Reset the desktop to its defaults? This clears everything you’ve saved.')) {
            resetPersistedState();
          }
        }}
      >
        <span aria-hidden="true">🔄</span>
        Reset Desktop
      </button>
    </div>
  );
}
