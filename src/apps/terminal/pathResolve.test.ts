import { describe, expect, test } from 'vitest';
import { formatCwdPath, resolvePath } from './pathResolve';
import type { FSNode } from '../../fs/fsTypes';

const nodes: Record<string, FSNode> = {
  root: { id: 'root', parentId: null, name: 'This PC', kind: 'folder', createdAt: 0, modifiedAt: 0 },
  docs: { id: 'docs', parentId: 'root', name: 'Documents', kind: 'folder', createdAt: 0, modifiedAt: 0 },
  reports: { id: 'reports', parentId: 'docs', name: 'Reports', kind: 'folder', createdAt: 0, modifiedAt: 0 },
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
};

describe('resolvePath', () => {
  test('resolves a single relative segment', () => {
    expect(resolvePath(nodes, 'root', 'root', 'Documents')?.id).toBe('docs');
  });

  test('resolves a multi-segment relative path', () => {
    expect(resolvePath(nodes, 'root', 'root', 'Documents/Reports')?.id).toBe('reports');
  });

  test('resolves an absolute path regardless of cwd', () => {
    expect(resolvePath(nodes, 'reports', 'root', '/Documents')?.id).toBe('docs');
  });

  test('resolves ".." to the parent', () => {
    expect(resolvePath(nodes, 'reports', 'root', '..')?.id).toBe('docs');
  });

  test('resolves "." to the current folder', () => {
    expect(resolvePath(nodes, 'docs', 'root', '.')?.id).toBe('docs');
  });

  test('resolves a file at the end of a path', () => {
    expect(resolvePath(nodes, 'root', 'root', 'Documents/a.txt')?.id).toBe('a');
  });

  test('returns undefined for a nonexistent segment', () => {
    expect(resolvePath(nodes, 'root', 'root', 'Nope')).toBeUndefined();
  });

  test('".." at the root stays at the root, rather than becoming undefined', () => {
    expect(resolvePath(nodes, 'root', 'root', '..')?.id).toBe('root');
  });
});

describe('formatCwdPath', () => {
  test('formats the root as "/"', () => {
    expect(formatCwdPath(nodes, 'root', 'root')).toBe('/');
  });

  test('formats a nested folder with a leading slash', () => {
    expect(formatCwdPath(nodes, 'reports', 'root')).toBe('/Documents/Reports');
  });
});
