import type { FileNode } from '../fs/fsTypes';
import { resolveAppForFileType } from './APP_REGISTRY';
import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';

/** Shared by Explorer and the Desktop: opens a file into whichever app claims its type. */
export function openFile(node: FileNode): void {
  const appDef = resolveAppForFileType(node.fileType);
  if (appDef === undefined) return;
  const windowId = useWindowStore.getState().openWindow(appDef.id, appDef.defaultSize);
  useAppInstanceStore.getState().patchInstanceState(windowId, { fileId: node.id, content: node.content });
}
