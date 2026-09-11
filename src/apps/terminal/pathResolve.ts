import type { FSNode } from '../../fs/fsTypes';
import { getChildren } from '../../fs/fsUtils';

/** Resolves a shell-style path (absolute `/a/b`, relative `a/b`, `.`, `..`) from `cwd`. */
export function resolvePath(
  nodes: Record<string, FSNode>,
  cwd: string,
  rootId: string,
  pathStr: string,
): FSNode | undefined {
  const segments = pathStr.split('/').filter((segment) => segment !== '');
  let currentId: string | undefined = pathStr.startsWith('/') ? rootId : cwd;

  for (const segment of segments) {
    if (currentId === undefined) return undefined;
    const parentId: string = currentId;
    if (segment === '.') continue;
    if (segment === '..') {
      currentId = nodes[parentId]?.parentId ?? parentId;
      continue;
    }
    const match: FSNode | undefined = getChildren(nodes, parentId).find((node) => node.name === segment);
    currentId = match?.id;
  }

  return currentId !== undefined ? nodes[currentId] : undefined;
}

/** Formats the current folder as a shell-style path for the prompt, e.g. "/Documents". */
export function formatCwdPath(nodes: Record<string, FSNode>, cwd: string, rootId: string): string {
  if (cwd === rootId) return '/';
  const parts: string[] = [];
  let current: FSNode | undefined = nodes[cwd];
  while (current !== undefined && current.id !== rootId) {
    parts.unshift(current.name);
    current = current.parentId === null ? undefined : nodes[current.parentId];
  }
  return `/${parts.join('/')}`;
}
