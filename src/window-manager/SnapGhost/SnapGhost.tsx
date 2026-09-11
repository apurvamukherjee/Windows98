import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Rect } from '../../stores/windowStore';
import styles from './SnapGhost.module.css';

export interface SnapGhostHandle {
  show: (rect: Rect) => void;
  hide: () => void;
}

/**
 * A single persistent DOM node whose style is mutated directly (never via
 * React state), so previewing a snap target on every drag frame costs zero
 * re-renders — the same discipline as window drag/resize itself.
 */
export const SnapGhost = forwardRef<SnapGhostHandle>(function SnapGhost(_props, ref) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      show: (rect) => {
        const node = nodeRef.current;
        if (node === null) return;
        node.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
        node.style.width = `${rect.w}px`;
        node.style.height = `${rect.h}px`;
        node.style.opacity = '1';
      },
      hide: () => {
        const node = nodeRef.current;
        if (node === null) return;
        node.style.opacity = '0';
      },
    }),
    [],
  );

  return <div ref={nodeRef} className={styles.ghost} />;
});
