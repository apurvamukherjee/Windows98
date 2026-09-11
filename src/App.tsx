import { useEffect } from 'react';
import { useWindowStore } from './stores/windowStore';
import { Window } from './window-manager/Window/Window';
import styles from './App.module.css';

export function App(): React.JSX.Element {
  useEffect(() => {
    useWindowStore.setState({
      windows: {
        a: {
          id: 'a',
          appId: 'Notepad',
          x: 80,
          y: 60,
          w: 380,
          h: 260,
          minimized: false,
          maximized: false,
          snapped: null,
        },
        b: {
          id: 'b',
          appId: 'Paint',
          x: 420,
          y: 160,
          w: 380,
          h: 260,
          minimized: false,
          maximized: false,
          snapped: null,
        },
      },
      zOrder: ['a', 'b'],
    });
  }, []);

  return (
    <div className={styles.desktop} data-testid="desktop">
      <Window id="a" />
      <Window id="b" />
    </div>
  );
}
