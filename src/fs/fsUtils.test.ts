import { describe, expect, test } from 'vitest';
import { getChildren, getPathChain, getTextFiles, uniqueSiblingName } from './fsUtils';
import type { FSNode } from './fsTypes';

const nodes: Record<string, FSNode> = {
  docs: { id: 'docs', parentId: 'root', name: 'Documents', kind: 'folder', createdAt: 0, modifiedAt: 0 },
  b: {
    id: 'b',
    parentId: 'docs',
    name: 'b.txt',
    kind: 'file',
    fileType: 'text',
    content: '',
    createdAt: 0,
    modifiedAt: 0,
  },
  a: {
    id: 'a',
    parentId: 'docs',
    name: 'a.txt',
    kind: 'file',
    fileType: 'text',
    content: '',
    createdAt: 0,
    modifiedAt: 0,
  },
  pic: {
    id: 'pic',
    parentId: 'docs',
    name: 'pic.png',
    kind: 'file',
    fileType: 'image',
    content: 'data:image/png;base64,',
    createdAt: 0,
    modifiedAt: 0,
  },
  other: {
    id: 'other',
    parentId: 'root',
    name: 'other.txt',
    kind: 'file',
    fileType: 'text',
    content: '',
    createdAt: 0,
    modifiedAt: 0,
  },
};

describe('getChildren', () => {
  test('returns only direct children of the given parent, sorted by name', () => {
    expect(getChildren(nodes, 'docs').map((n) => n.id)).toEqual(['a', 'b', 'pic']);
  });

  test('returns an empty array for a folder with no children', () => {
    expect(getChildren(nodes, 'empty')).toEqual([]);
  });
});

describe('getTextFiles', () => {
  test('filters to text files only, within the given folder', () => {
    expect(getTextFiles(nodes, 'docs').map((n) => n.id)).toEqual(['a', 'b']);
  });
});

describe('getChildren folder-first ordering', () => {
  test('lists folders before files, each group alphabetical', () => {
    const mixed: Record<string, FSNode> = {
      ...nodes,
      zzzFolder: { id: 'zzzFolder', parentId: 'docs', name: 'zzz', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    };
    expect(getChildren(mixed, 'docs').map((n) => n.id)).toEqual(['zzzFolder', 'a', 'b', 'pic']);
  });
});

describe('getPathChain', () => {
  test('returns the root-to-node chain', () => {
    const root: FSNode = { id: 'root', parentId: null, name: 'This PC', kind: 'folder', createdAt: 0, modifiedAt: 0 };
    const withRoot = { ...nodes, root, docs: { ...nodes.docs, parentId: 'root' } as FSNode };
    expect(getPathChain(withRoot, 'a').map((n) => n.name)).toEqual(['This PC', 'Documents', 'a.txt']);
  });

  test('returns a single-element chain for the root itself', () => {
    const root: FSNode = { id: 'root', parentId: null, name: 'This PC', kind: 'folder', createdAt: 0, modifiedAt: 0 };
    expect(getPathChain({ root }, 'root').map((n) => n.name)).toEqual(['This PC']);
  });
});

describe('uniqueSiblingName', () => {
  test('returns the name unchanged when there is no collision', () => {
    expect(uniqueSiblingName(nodes, 'docs', 'New Folder')).toBe('New Folder');
  });

  test('appends (1) on first collision, then increments', () => {
    const withNewFolder: Record<string, FSNode> = {
      ...nodes,
      nf: { id: 'nf', parentId: 'docs', name: 'New Folder', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    };
    expect(uniqueSiblingName(withNewFolder, 'docs', 'New Folder')).toBe('New Folder (1)');

    const withTwo: Record<string, FSNode> = {
      ...withNewFolder,
      nf1: { id: 'nf1', parentId: 'docs', name: 'New Folder (1)', kind: 'folder', createdAt: 0, modifiedAt: 0 },
    };
    expect(uniqueSiblingName(withTwo, 'docs', 'New Folder')).toBe('New Folder (2)');
  });
});
