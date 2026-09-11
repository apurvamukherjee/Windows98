import { beforeEach, describe, expect, test } from 'vitest';
import { DOCUMENTS_ID, RECYCLE_BIN_ID, ROOT_ID, seedFolders, useFSStore } from './fsStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
});

describe('seeded tree', () => {
  test('boots with This PC, Desktop, Documents, and Recycle Bin', () => {
    const nodes = useFSStore.getState().nodes;
    expect(nodes[ROOT_ID]).toMatchObject({ kind: 'folder', parentId: null });
    expect(nodes[DOCUMENTS_ID]).toMatchObject({ kind: 'folder', parentId: ROOT_ID });
    expect(nodes[RECYCLE_BIN_ID]).toMatchObject({ kind: 'folder', parentId: ROOT_ID });
  });
});

describe('createFile', () => {
  test('creates a text file under the given parent with a fresh id', () => {
    const id = useFSStore.getState().createFile(DOCUMENTS_ID, 'notes.txt', 'text', 'hello');

    const node = useFSStore.getState().nodes[id];
    expect(node).toMatchObject({ parentId: DOCUMENTS_ID, name: 'notes.txt', kind: 'file', content: 'hello' });
  });

  test('assigns distinct ids across calls', () => {
    const idA = useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    const idB = useFSStore.getState().createFile(DOCUMENTS_ID, 'b.txt', 'text', '');
    expect(idA).not.toBe(idB);
  });
});

describe('updateFileContent', () => {
  test('updates content and modifiedAt, leaving other nodes untouched by reference', () => {
    const id = useFSStore.getState().createFile(DOCUMENTS_ID, 'notes.txt', 'text', 'v1');
    const before = useFSStore.getState().nodes;

    useFSStore.getState().updateFileContent(id, 'v2');

    const after = useFSStore.getState().nodes;
    expect(after[id]).toMatchObject({ content: 'v2' });
    expect(after[id]).not.toBe(before[id]);
    expect(after[ROOT_ID]).toBe(before[ROOT_ID]);
  });

  test('is a no-op for an unknown id', () => {
    const before = useFSStore.getState();
    useFSStore.getState().updateFileContent('missing', 'x');
    expect(useFSStore.getState()).toBe(before);
  });

  test('is a no-op for a folder id', () => {
    const before = useFSStore.getState();
    useFSStore.getState().updateFileContent(DOCUMENTS_ID, 'x');
    expect(useFSStore.getState()).toBe(before);
  });
});

describe('createFolder', () => {
  test('creates a folder under the given parent', () => {
    const id = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Photos');
    expect(useFSStore.getState().nodes[id]).toMatchObject({ parentId: DOCUMENTS_ID, name: 'Photos', kind: 'folder' });
  });

  test('auto-suffixes on a name collision with a sibling', () => {
    useFSStore.getState().createFolder(DOCUMENTS_ID, 'Photos');
    const secondId = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Photos');
    expect(useFSStore.getState().nodes[secondId]).toMatchObject({ name: 'Photos (1)' });
  });
});

describe('renameNode', () => {
  test('renames a node', () => {
    const id = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Old');
    useFSStore.getState().renameNode(id, 'New');
    expect(useFSStore.getState().nodes[id]).toMatchObject({ name: 'New' });
  });

  test('is a no-op when the name is unchanged (same reference)', () => {
    const id = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Same');
    const before = useFSStore.getState();
    useFSStore.getState().renameNode(id, 'Same');
    expect(useFSStore.getState()).toBe(before);
  });
});

describe('moveNode', () => {
  test('moves a node to a new parent', () => {
    const id = useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    useFSStore.getState().moveNode(id, RECYCLE_BIN_ID);
    expect(useFSStore.getState().nodes[id]).toMatchObject({ parentId: RECYCLE_BIN_ID });
  });

  test('refuses to move a folder into itself', () => {
    const id = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Sub');
    const before = useFSStore.getState();
    useFSStore.getState().moveNode(id, id);
    expect(useFSStore.getState()).toBe(before);
  });

  test('refuses to move a folder into its own descendant', () => {
    const parentId = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Parent');
    const childId = useFSStore.getState().createFolder(parentId, 'Child');
    const before = useFSStore.getState();

    useFSStore.getState().moveNode(parentId, childId);

    expect(useFSStore.getState()).toBe(before);
  });
});
