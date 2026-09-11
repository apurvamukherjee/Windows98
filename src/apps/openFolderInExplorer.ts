import { APP_REGISTRY } from './APP_REGISTRY';
import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';

/** Opens a new Explorer window scoped to the given folder — used by Desktop double-click. */
export function openFolderInExplorer(folderId: string): void {
  const appDef = APP_REGISTRY.explorer;
  if (appDef === undefined) return;
  const windowId = useWindowStore.getState().openWindow(appDef.id, appDef.defaultSize);
  useAppInstanceStore.getState().patchInstanceState(windowId, { currentFolderId: folderId });
}
