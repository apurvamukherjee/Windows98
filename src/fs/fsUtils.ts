import type { FileNode, FSNode } from './fsTypes';

export function getChildren(nodes: Record<string, FSNode>, parentId: string): FSNode[] {
  return Object.values(nodes)
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function getTextFiles(nodes: Record<string, FSNode>, parentId: string): FileNode[] {
  return getChildren(nodes, parentId).filter(
    (node): node is FileNode => node.kind === 'file' && node.fileType === 'text',
  );
}

export function getImageFiles(nodes: Record<string, FSNode>, parentId: string): FileNode[] {
  return getChildren(nodes, parentId).filter(
    (node): node is FileNode => node.kind === 'file' && node.fileType === 'image',
  );
}

/** Root-to-node chain, e.g. [This PC, Documents], for breadcrumbs. */
export function getPathChain(nodes: Record<string, FSNode>, id: string): FSNode[] {
  const chain: FSNode[] = [];
  let current: FSNode | undefined = nodes[id];
  while (current !== undefined) {
    chain.unshift(current);
    current = current.parentId === null ? undefined : nodes[current.parentId];
  }
  return chain;
}

/** Appends " (1)", " (2)", ... until `name` doesn't collide with a sibling. */
export function uniqueSiblingName(nodes: Record<string, FSNode>, parentId: string, name: string): string {
  const siblingNames = new Set(getChildren(nodes, parentId).map((node) => node.name));
  if (!siblingNames.has(name)) return name;
  let suffix = 1;
  while (siblingNames.has(`${name} (${suffix})`)) suffix += 1;
  return `${name} (${suffix})`;
}
