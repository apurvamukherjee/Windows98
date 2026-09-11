export type FileType = 'text' | 'image';

interface FSNodeBase {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: number;
  modifiedAt: number;
}

export interface FolderNode extends FSNodeBase {
  kind: 'folder';
}

export interface FileNode extends FSNodeBase {
  kind: 'file';
  fileType: FileType;
  /** Raw text for `fileType: 'text'`; a data URL for `fileType: 'image'`. */
  content: string;
}

export type FSNode = FolderNode | FileNode;
