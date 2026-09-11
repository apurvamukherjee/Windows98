import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import { useFSStore, ROOT_ID } from '../stores/fsStore';

export type DropTarget = { kind: 'explorer'; folderId: string } | { kind: 'desktop' } | null;

/**
 * Resolves what's under a point at drag-end, so cross-window file moves
 * (desktop icon <-> an open Explorer window) can be detected without native
 * HTML5 DnD — which would conflict with the pointer-based dragging these
 * same icons use for same-surface repositioning. One drag primitive, used
 * for both same-surface and cross-window moves.
 */
export function resolveDropTarget(clientX: number, clientY: number): DropTarget {
  const el = document.elementFromPoint(clientX, clientY);
  if (el === null) return null;

  // Dropping onto another desktop icon that's itself a folder (Recycle Bin
  // included) moves the item inside it — the same "check what's under the
  // cursor" resolution as dropping onto an open Explorer window.
  const iconId = el.closest('[data-desktop-icon-id]')?.getAttribute('data-desktop-icon-id');
  if (iconId !== null && iconId !== undefined) {
    const iconNode = useFSStore.getState().nodes[iconId];
    if (iconNode?.kind === 'folder') return { kind: 'explorer', folderId: iconNode.id };
  }

  const windowEl = el.closest('[data-testid^="window-"]');
  if (windowEl === null) {
    return el.closest('[data-testid="desktop"]') !== null ? { kind: 'desktop' } : null;
  }

  const testId = windowEl.getAttribute('data-testid');
  const windowId = testId?.startsWith('window-') === true ? testId.slice('window-'.length) : undefined;
  if (windowId === undefined) return null;

  const win = useWindowStore.getState().windows[windowId];
  if (win === undefined || win.appId !== 'explorer') return null;

  const instance = useAppInstanceStore.getState().byWindowId[windowId];
  const folderId = typeof instance?.currentFolderId === 'string' ? instance.currentFolderId : ROOT_ID;
  return { kind: 'explorer', folderId };
}
