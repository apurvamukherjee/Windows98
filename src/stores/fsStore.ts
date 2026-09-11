import { create } from 'zustand';
import type { FileType, FolderNode, FSNode } from '../fs/fsTypes';

export const ROOT_ID = 'root';
export const DESKTOP_ID = 'desktop';
export const DOCUMENTS_ID = 'documents';
export const RECYCLE_BIN_ID = 'recycle-bin';

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

  return {
    [ROOT_ID]: folder(ROOT_ID, null, 'This PC'),
    [DESKTOP_ID]: folder(DESKTOP_ID, ROOT_ID, 'Desktop'),
    [DOCUMENTS_ID]: folder(DOCUMENTS_ID, ROOT_ID, 'Documents'),
    [RECYCLE_BIN_ID]: folder(RECYCLE_BIN_ID, ROOT_ID, 'Recycle Bin'),
  };
}

interface FSStoreState {
  nodes: Record<string, FSNode>;
  nextNodeSeq: number;
  createFile: (parentId: string, name: string, fileType: FileType, content: string) => string;
  updateFileContent: (id: string, content: string) => void;
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
}));
