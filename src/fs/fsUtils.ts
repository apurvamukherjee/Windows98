import type { FileNode, FSNode } from './fsTypes';

export function getChildren(nodes: Record<string, FSNode>, parentId: string): FSNode[] {
  return Object.values(nodes)
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTextFiles(nodes: Record<string, FSNode>, parentId: string): FileNode[] {
  return getChildren(nodes, parentId).filter(
    (node): node is FileNode => node.kind === 'file' && node.fileType === 'text',
  );
}
