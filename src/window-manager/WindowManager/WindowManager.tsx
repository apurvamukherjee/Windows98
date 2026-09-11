import { useEffect, useRef } from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { Window } from '../Window/Window';
import { SnapGhost, type SnapGhostHandle } from '../SnapGhost/SnapGhost';

export function WindowManager(): React.JSX.Element {
  // Subscribing only to zOrder (not the whole `windows` record) keeps this
  // component's re-renders limited to focus/open/close — move/resize/minimize
  // commits touch only the affected Window's own slice, so siblings never
  // re-render because of them.
  const zOrder = useWindowStore((state) => state.zOrder);
  const snapGhostRef = useRef<SnapGhostHandle>(null);

  useEffect(() => {
    // Real Alt+Tab is an OS-level shortcut that never reaches page JS —
    // Ctrl+Tab (Cmd+Tab on Mac) is the closest binding that page script can
    // actually intercept. Shift reverses direction, matching Alt+Shift+Tab.
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab' || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      useWindowStore.getState().cycleFocus(event.shiftKey ? 1 : -1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {zOrder.map((id) => (
        <Window key={id} id={id} snapGhostRef={snapGhostRef} />
      ))}
      <SnapGhost ref={snapGhostRef} />
    </>
  );
}
