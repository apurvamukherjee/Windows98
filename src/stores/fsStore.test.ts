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
