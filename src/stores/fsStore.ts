import { create } from 'zustand';
import type { FileNode, FileType, FolderNode, FSNode } from '../fs/fsTypes';
import { uniqueSiblingName } from '../fs/fsUtils';

export const ROOT_ID = 'root';
export const DESKTOP_ID = 'desktop';
export const DOCUMENTS_ID = 'documents';
export const RECYCLE_BIN_ID = 'recycle-bin';
export const CREDITS_ID = 'credits';

const CREDITS_TEXT = [
  "So you went looking for the credits file. That's the right instinct.",
  '',
  'Windows98.app is a from-scratch simulation of a desktop OS, built to',
  'run entirely in the browser — real drag/resize physics, a real window',
  'manager, a real (virtual) file system shared live across every app.',
  '',
  'Built by Apurva Mukherjee as a portfolio centerpiece.',
  '',
  'Thanks for opening this file. Try the Terminal — not every command',
  'in there is documented.',
].join('\n');

export function seedFolders(): Record<string, FSNode> {
  const now = Date.now();
  const folder = (id: string, parentId: string | null, name: string): FolderNode => ({
    id,
    parentId,
    name,
    kind: 'folder',
    createdAt: now,
    modifiedAt: now,
  });
  const credits: FileNode = {
    id: CREDITS_ID,
    parentId: DOCUMENTS_ID,
    name: 'credits.txt',
    kind: 'file',
    fileType: 'text',
    content: CREDITS_TEXT,
    createdAt: now,
    modifiedAt: now,
  };

  return {
    [ROOT_ID]: folder(ROOT_ID, null, 'This PC'),
    [DESKTOP_ID]: folder(DESKTOP_ID, ROOT_ID, 'Desktop'),
    [DOCUMENTS_ID]: folder(DOCUMENTS_ID, ROOT_ID, 'Documents'),
    [RECYCLE_BIN_ID]: folder(RECYCLE_BIN_ID, ROOT_ID, 'Recycle Bin'),
    [CREDITS_ID]: credits,
  };
}

interface FSStoreState {
  nodes: Record<string, FSNode>;
  nextNodeSeq: number;
  createFile: (parentId: string, name: string, fileType: FileType, content: string) => string;
  updateFileContent: (id: string, content: string) => void;
  createFolder: (parentId: string, name: string) => string;
  renameNode: (id: string, name: string) => void;
  moveNode: (id: string, newParentId: string) => void;
}

export const useFSStore = create<FSStoreState>((set, get) => ({
  nodes: seedFolders(),
  nextNodeSeq: 0,

  createFile: (parentId, name, fileType, content) => {
    const seq = get().nextNodeSeq;
    const id = `file-${seq}`;
    const now = Date.now();
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { id, parentId, name, kind: 'file', fileType, content, createdAt: now, modifiedAt: now },
      },
      nextNodeSeq: seq + 1,
    }));
    return id;
  },

  updateFileContent: (id, content) =>
    set((state) => {
      const node = state.nodes[id];
      if (node === undefined || node.kind !== 'file') return state;
      return {
        nodes: { ...state.nodes, [id]: { ...node, content, modifiedAt: Date.now() } },
      };
    }),

  createFolder: (parentId, name) => {
    const seq = get().nextNodeSeq;
    const id = `folder-${seq}`;
    const now = Date.now();
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: {
          id,
          parentId,
          name: uniqueSiblingName(state.nodes, parentId, name),
          kind: 'folder',
          createdAt: now,
          modifiedAt: now,
        },
      },
      nextNodeSeq: seq + 1,
    }));
    return id;
  },

  renameNode: (id, name) =>
    set((state) => {
      const node = state.nodes[id];
      if (node === undefined || node.name === name) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, name, modifiedAt: Date.now() } } };
    }),

  moveNode: (id, newParentId) =>
    set((state) => {
      const node = state.nodes[id];
      if (node === undefined || node.parentId === newParentId) return state;
      // Refuse moving a folder into itself or one of its own descendants —
      // otherwise the parent chain gains a cycle and getPathChain loops forever.
      let ancestor: FSNode | undefined = state.nodes[newParentId];
      while (ancestor !== undefined) {
        if (ancestor.id === id) return state;
        ancestor = ancestor.parentId === null ? undefined : state.nodes[ancestor.parentId];
      }
      return {
        nodes: { ...state.nodes, [id]: { ...node, parentId: newParentId, modifiedAt: Date.now() } },
      };
    }),
}));
