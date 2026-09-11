import { useRef } from 'react';
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

  return (
    <>
      {zOrder.map((id) => (
        <Window key={id} id={id} snapGhostRef={snapGhostRef} />
      ))}
      <SnapGhost ref={snapGhostRef} />
    </>
  );
}
