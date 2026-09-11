import { useRef, useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { useFSStore, ROOT_ID, RECYCLE_BIN_ID, DESKTOP_ID } from '../../stores/fsStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { getChildren, getPathChain } from '../../fs/fsUtils';
import { openFile } from '../openFile';
import { FolderTree } from './FolderTree';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { resolveDropTarget } from '../../desktop/dropTarget';
import { snapToGrid } from '../../desktop/grid';
import type { FSNode } from '../../fs/fsTypes';
import styles from './Explorer.module.css';

function nodeIcon(node: FSNode): string {
  if (node.kind === 'folder') return '📁';
  return node.fileType === 'image' ? '🖼️' : '📄';
}

export function Explorer({ windowId }: AppComponentProps): React.JSX.Element {
  const instance = useAppInstanceStore((state) => state.byWindowId[windowId]);
  const patchInstanceState = useAppInstanceStore((state) => state.patchInstanceState);
  const currentFolderId = typeof instance?.currentFolderId === 'string' ? instance.currentFolderId : ROOT_ID;

  const nodes = useFSStore((state) => state.nodes);
  const createFolder = useFSStore((state) => state.createFolder);
  const renameNode = useFSStore((state) => state.renameNode);
  const moveNode = useFSStore((state) => state.moveNode);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [viewMode, setViewMode] = useState<'icons' | 'list'>('icons');

  const dragNodeId = useRef<string | null>(null);
  const itemDrag = usePointerDrag({
    onDrag: () => {
      // No visual feedback mid-drag — the item just stays put until drop;
      // only the drop target matters here, unlike window/icon dragging.
    },
    onDragEnd: (dx, dy, clientX, clientY) => {
      const id = dragNodeId.current;
      if (id === null || (dx === 0 && dy === 0)) return;
      const target = resolveDropTarget(clientX, clientY);
      if (target?.kind === 'desktop') {
        moveNode(id, DESKTOP_ID);
        const snapped = snapToGrid(clientX, clientY);
        useDesktopStore.getState().setIconPosition(id, snapped.x, snapped.y);
      } else if (target?.kind === 'explorer') {
        moveNode(id, target.folderId);
      }
    },
  });

  const navigate = (folderId: string): void => {
    patchInstanceState(windowId, { currentFolderId: folderId });
    setSelectedId(null);
    setRenamingId(null);
  };

  const currentFolder = nodes[currentFolderId];
  const children = getChildren(nodes, currentFolderId);
  const pathChain = getPathChain(nodes, currentFolderId);

  const onOpenItem = (node: FSNode): void => {
    if (node.kind === 'folder') {
      navigate(node.id);
      return;
    }
    openFile(node);
  };

  const onNewFolder = (): void => {
    const id = createFolder(currentFolderId, 'New Folder');
    setSelectedId(id);
  };

  const onStartRename = (): void => {
    if (selectedId === null) return;
    const node = nodes[selectedId];
    if (node === undefined) return;
    setRenamingId(selectedId);
    setRenameValue(node.name);
  };

  const onCommitRename = (): void => {
    if (renamingId === null) return;
    const trimmed = renameValue.trim();
    if (trimmed !== '') renameNode(renamingId, trimmed);
    setRenamingId(null);
  };

  const onDelete = (): void => {
    if (selectedId === null) return;
    moveNode(selectedId, RECYCLE_BIN_ID);
    setSelectedId(null);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          disabled={currentFolder?.parentId === null || currentFolder?.parentId === undefined}
          onClick={() => {
            const parentId = currentFolder?.parentId;
            if (parentId !== null && parentId !== undefined) navigate(parentId);
          }}
        >
          Up
        </button>
        <button type="button" className={styles.toolbarButton} onClick={onNewFolder}>
          New Folder
        </button>
        <button type="button" className={styles.toolbarButton} disabled={selectedId === null} onClick={onStartRename}>
          Rename
        </button>
        <button type="button" className={styles.toolbarButton} disabled={selectedId === null} onClick={onDelete}>
          Delete
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => setViewMode((mode) => (mode === 'icons' ? 'list' : 'icons'))}
        >
          {viewMode === 'icons' ? 'List view' : 'Icon view'}
        </button>
        <div className={styles.breadcrumb}>
          {pathChain.map((node, index) => (
            <span key={node.id}>
              <button type="button" className={styles.breadcrumbSegment} onClick={() => navigate(node.id)}>
                {node.name}
              </button>
              {index < pathChain.length - 1 && '›'}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.body}>
        <FolderTree currentFolderId={currentFolderId} onNavigate={navigate} />
        <div className={styles.main}>
          {children.length === 0 && <div className={styles.emptyState}>This folder is empty.</div>}
          {viewMode === 'icons' ? (
            <div className={styles.iconGrid}>
              {children.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`${styles.iconItem} ${node.id === selectedId ? styles.iconItemSelected : ''}`}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => onOpenItem(node)}
                  onPointerDown={(event) => {
                    dragNodeId.current = node.id;
                    itemDrag.onPointerDown(event);
                  }}
                >
                  <span className={styles.iconGlyph}>{nodeIcon(node)}</span>
                  {renamingId === node.id ? (
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      autoFocus
                      onFocus={(event) => event.target.select()}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={onCommitRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') onCommitRename();
                        if (event.key === 'Escape') setRenamingId(null);
                      }}
                    />
                  ) : (
                    <span>{node.name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.listRows}>
              {children.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={`${styles.listRow} ${node.id === selectedId ? styles.listRowSelected : ''}`}
                  onClick={() => setSelectedId(node.id)}
                  onDoubleClick={() => onOpenItem(node)}
                >
                  <span>{nodeIcon(node)}</span>
                  <span>{node.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
