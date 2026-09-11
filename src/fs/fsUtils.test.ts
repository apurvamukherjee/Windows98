import { describe, expect, test } from 'vitest';
import { getChildren, getTextFiles } from './fsUtils';
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
