import { APP_REGISTRY } from '../../apps/APP_REGISTRY';
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
    </div>
  );
}
