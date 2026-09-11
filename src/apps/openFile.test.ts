import { beforeEach, describe, expect, test } from 'vitest';
import { openFile } from './openFile';
import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import type { FileNode, FileType } from '../fs/fsTypes';

beforeEach(() => {
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
});

function textFile(overrides: Partial<FileNode> = {}): FileNode {
  return {
    id: 'file-0',
    parentId: 'documents',
    name: 'notes.txt',
    kind: 'file',
    fileType: 'text',
    content: 'hello',
    createdAt: 0,
    modifiedAt: 0,
    ...overrides,
  };
}

describe('openFile', () => {
  test('opens a window for a registered app and seeds its instance state', () => {
    openFile(textFile());

    const state = useWindowStore.getState();
    const windowId = state.zOrder.at(-1);
    expect(windowId).toBeDefined();
    expect(state.windows[windowId ?? '']).toMatchObject({ appId: 'notepad' });
    expect(useAppInstanceStore.getState().byWindowId[windowId ?? '']).toMatchObject({
      fileId: 'file-0',
      content: 'hello',
    });
  });

  test('opens a window for the other registered app (image -> Paint)', () => {
    openFile(textFile({ fileType: 'image' }));
    const state = useWindowStore.getState();
    expect(state.windows[state.zOrder.at(-1) ?? '']).toMatchObject({ appId: 'paint' });
  });

  test('does nothing for a file type with no registered app', () => {
    // Every current FileType has a registered app; this exercises the
    // defensive "no match" path for a hypothetical future type that hasn't
    // shipped an app yet.
    openFile(textFile({ fileType: 'unknown-future-type' as unknown as FileType }));
    expect(useWindowStore.getState().zOrder).toEqual([]);
  });
});
