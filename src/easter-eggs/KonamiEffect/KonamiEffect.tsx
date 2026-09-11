import { useEffect, useRef, useState } from 'react';
import { KONAMI_SEQUENCE, matchesKonamiCode } from '../konami';
import styles from './KonamiEffect.module.css';

const WOBBLE_DURATION_MS = 1200;
// CSS module classnames type as `string | undefined` under noUncheckedIndexedAccess;
// this key always exists at runtime, so a fallback just satisfies the compiler.
const wobbleClass = styles.wobble ?? 'wobble';

/** Renders nothing — it just watches for the Konami code and wobbles document.body when it lands. */
export function KonamiEffect(): null {
  const bufferRef = useRef<string[]>([]);
  const [wobbling, setWobbling] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      bufferRef.current = [...bufferRef.current, event.key].slice(-KONAMI_SEQUENCE.length);
      if (matchesKonamiCode(bufferRef.current)) {
        bufferRef.current = [];
        setWobbling(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!wobbling) return;
    document.body.classList.add(wobbleClass);
    const timer = setTimeout(() => {
      document.body.classList.remove(wobbleClass);
      setWobbling(false);
    }, WOBBLE_DURATION_MS);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove(wobbleClass);
    };
  }, [wobbling]);

  return null;
}
