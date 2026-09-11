import { beforeEach, expect, test } from 'vitest';
import { openFolderInExplorer } from './openFolderInExplorer';
import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import { DOCUMENTS_ID } from '../stores/fsStore';

beforeEach(() => {
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
});

test('opens an Explorer window scoped to the given folder', () => {
  openFolderInExplorer(DOCUMENTS_ID);

  const state = useWindowStore.getState();
  const windowId = state.zOrder.at(-1);
  expect(windowId).toBeDefined();
  expect(state.windows[windowId ?? '']).toMatchObject({ appId: 'explorer' });
  expect(useAppInstanceStore.getState().byWindowId[windowId ?? '']).toMatchObject({
    currentFolderId: DOCUMENTS_ID,
  });
});
