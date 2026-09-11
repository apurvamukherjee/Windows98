import { useMemo, useRef, useState } from 'react';
import { useFSStore, DESKTOP_ID, RECYCLE_BIN_ID } from '../../stores/fsStore';
import { useDesktopStore } from '../../stores/desktopStore';
import { getChildren } from '../../fs/fsUtils';
import { assignDefaultPositions, snapToGrid } from '../grid';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { resolveDropTarget } from '../dropTarget';
import { openFile } from '../../apps/openFile';
import { openFolderInExplorer } from '../../apps/openFolderInExplorer';
import { DesktopIcon } from '../DesktopIcon/DesktopIcon';
import { ContextMenu, type ContextMenuItem } from '../../context-menu/ContextMenu/ContextMenu';
import type { FSNode } from '../../fs/fsTypes';
import styles from './Desktop.module.css';

function nodeIcon(node: FSNode): string {
  if (node.kind === 'folder') return '📁';
  return node.fileType === 'image' ? '🖼️' : '📄';
}

// See the project's wallpaper decision: the real Windows 98 bitmap
// wallpapers (Clouds, Rivets, Bubbles, the tiled "Windows" pattern, etc.)
// are Microsoft's copyrighted assets, not something to redistribute in a
// public repo. Everything below is an original CSS gradient/pattern
// evoking the period style — never a reproduction of a shipped asset.
const WALLPAPER_PRESETS: { label: string; background: string }[] = [
  { label: 'Teal', background: '#008080' },
  { label: 'Navy', background: '#000080' },
  { label: 'Maroon', background: '#800000' },
  { label: 'Purple', background: '#800080' },
  { label: 'Dark Gray', background: '#808080' },
  {
    label: 'Clouds',
    background:
      'radial-gradient(circle at 18% 28%, rgba(255,255,255,0.9) 0 34px, transparent 46px), ' +
      'radial-gradient(circle at 55% 65%, rgba(255,255,255,0.85) 0 46px, transparent 60px), ' +
      'radial-gradient(circle at 82% 22%, rgba(255,255,255,0.8) 0 28px, transparent 40px), ' +
      'radial-gradient(circle at 35% 85%, rgba(255,255,255,0.75) 0 30px, transparent 42px), ' +
      'linear-gradient(180deg, #4d7fc0, #bcdcf4)',
  },
  {
    label: 'Rivets',
    background: 'radial-gradient(circle, #3a3a3a 0 3px, transparent 4px) 0 0/22px 22px, #6f7a85',
  },
  {
    label: 'Bubbles',
    background: 'radial-gradient(circle, rgba(255,255,255,0.55) 0 6px, transparent 7px) 0 0/28px 28px, #008080',
  },
  {
    label: 'Squares',
    background: 'repeating-conic-gradient(#006666 0% 25%, #008080 0% 50%) 0 0/18px 18px',
  },
];

interface MenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function Desktop(): React.JSX.Element {
  const nodes = useFSStore((state) => state.nodes);
  const moveNode = useFSStore((state) => state.moveNode);
  const renameNode = useFSStore((state) => state.renameNode);
  const createFolder = useFSStore((state) => state.createFolder);
  const iconPositions = useDesktopStore((state) => state.iconPositions);
  const setIconPosition = useDesktopStore((state) => state.setIconPosition);
  const setWallpaper = useDesktopStore((state) => state.setWallpaper);

  const children = getChildren(nodes, DESKTOP_ID);
  const defaultPositions = useMemo(
    () => assignDefaultPositions(children.map((child) => child.id), iconPositions),
    [children, iconPositions],
  );
  const positionOf = (id: string): { x: number; y: number } =>
    iconPositions[id] ?? defaultPositions[id] ?? { x: 0, y: 0 };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menu, setMenu] = useState<MenuState | null>(null);

  const iconNodeRefs = useRef(new Map<string, HTMLDivElement>());
  const dragIconId = useRef<string | null>(null);
  const ctrlHeld = useRef(false);
  const dragMoveSet = useRef<Set<string>>(new Set());
  const dragBase = useRef<Map<string, { x: number; y: number }>>(new Map());

  const iconDrag = usePointerDrag({
    onDragStart: () => {
      const id = dragIconId.current;
      if (id === null) return;
      const nextSelection = ctrlHeld.current || selectedIds.has(id) ? new Set(selectedIds) : new Set<string>();
      nextSelection.add(id);
      setSelectedIds(nextSelection);
      dragMoveSet.current = nextSelection;
      dragBase.current = new Map();
      for (const memberId of nextSelection) {
        dragBase.current.set(memberId, positionOf(memberId));
      }
    },
    onDrag: (dx, dy) => {
      for (const memberId of dragMoveSet.current) {
        const base = dragBase.current.get(memberId);
        const node = iconNodeRefs.current.get(memberId);
        if (base === undefined || node === undefined) continue;
        node.style.transform = `translate3d(${base.x + dx}px, ${base.y + dy}px, 0)`;
      }
    },
    onDragEnd: (dx, dy, clientX, clientY) => {
      if (dx === 0 && dy === 0) {
        const id = dragIconId.current;
        if (id !== null && ctrlHeld.current) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id) && next.size > 1) next.delete(id);
            else next.add(id);
            return next;
          });
        }
        return;
      }

      const target = resolveDropTarget(clientX, clientY);
      for (const memberId of dragMoveSet.current) {
        const base = dragBase.current.get(memberId);
        if (base === undefined) continue;
        if (target?.kind === 'explorer') {
          moveNode(memberId, target.folderId);
        } else {
          const snapped = snapToGrid(base.x + dx, base.y + dy);
          setIconPosition(memberId, snapped.x, snapped.y);
        }
      }
    },
  });

  const onIconPointerDown = (id: string, event: React.PointerEvent): void => {
    event.stopPropagation();
    ctrlHeld.current = event.ctrlKey || event.metaKey;
    dragIconId.current = id;
    iconDrag.onPointerDown(event);
  };

  const rubberBandRef = useRef<HTMLDivElement>(null);
  const rubberStart = useRef({ x: 0, y: 0 });

  const rubberBandDrag = usePointerDrag({
    onDrag: (dx, dy) => {
      const node = rubberBandRef.current;
      if (node === null) return;
      const start = rubberStart.current;
      node.style.transform = `translate3d(${Math.min(start.x, start.x + dx)}px, ${Math.min(start.y, start.y + dy)}px, 0)`;
      node.style.width = `${Math.abs(dx)}px`;
      node.style.height = `${Math.abs(dy)}px`;
      node.style.opacity = '1';
    },
    onDragEnd: (dx, dy) => {
      const node = rubberBandRef.current;
      if (node !== null) node.style.opacity = '0';
      const start = rubberStart.current;
      const x1 = Math.min(start.x, start.x + dx);
      const y1 = Math.min(start.y, start.y + dy);
      const x2 = Math.max(start.x, start.x + dx);
      const y2 = Math.max(start.y, start.y + dy);

      const hits = new Set<string>();
      for (const [id, el] of iconNodeRefs.current) {
        const box = el.getBoundingClientRect();
        if (box.left < x2 && box.right > x1 && box.top < y2 && box.bottom > y1) hits.add(id);
      }
      if (hits.size > 0) setSelectedIds(hits);
    },
  });

  const onBackgroundPointerDown = (event: React.PointerEvent): void => {
    if (event.button !== 0) return;
    rubberStart.current = { x: event.clientX, y: event.clientY };
    if (!(event.ctrlKey || event.metaKey)) setSelectedIds(new Set());
    rubberBandDrag.onPointerDown(event);
  };

  const onOpenNode = (node: FSNode): void => {
    if (node.kind === 'folder') {
      openFolderInExplorer(node.id);
      return;
    }
    openFile(node);
  };

  const onStartRename = (id: string): void => {
    const node = nodes[id];
    if (node === undefined) return;
    setRenamingId(id);
    setRenameValue(node.name);
  };

  const onCommitRename = (): void => {
    if (renamingId === null) return;
    const trimmed = renameValue.trim();
    if (trimmed !== '') renameNode(renamingId, trimmed);
    setRenamingId(null);
  };

  const onIconContextMenu = (id: string, event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    const targetIds = selectedIds.has(id) ? selectedIds : new Set([id]);
    setSelectedIds(targetIds);
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'Open',
          onSelect: () => {
            for (const targetId of targetIds) {
              const node = nodes[targetId];
              if (node !== undefined) onOpenNode(node);
            }
          },
        },
        {
          label: 'Rename',
          disabled: targetIds.size !== 1,
          onSelect: () => {
            const [onlyId] = targetIds;
            if (onlyId !== undefined) onStartRename(onlyId);
          },
        },
        {
          label: 'Delete',
          onSelect: () => {
            for (const targetId of targetIds) moveNode(targetId, RECYCLE_BIN_ID);
            setSelectedIds(new Set());
          },
        },
      ],
    });
  };

  const onBackgroundContextMenu = (event: React.MouseEvent): void => {
    event.preventDefault();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'New Folder',
          onSelect: () => {
            const id = createFolder(DESKTOP_ID, 'New Folder');
            setSelectedIds(new Set([id]));
          },
        },
        ...WALLPAPER_PRESETS.map((preset) => ({
          label: `Wallpaper: ${preset.label}`,
          onSelect: () => setWallpaper(preset.background),
        })),
      ],
    });
  };

  return (
    <div className={styles.desktop} onPointerDown={onBackgroundPointerDown} onContextMenu={onBackgroundContextMenu}>
      {children.map((node) => {
        const pos = positionOf(node.id);
        return (
          <DesktopIcon
            key={node.id}
            name={node.name}
            glyph={nodeIcon(node)}
            x={pos.x}
            y={pos.y}
            selected={selectedIds.has(node.id)}
            renaming={renamingId === node.id}
            renameValue={renameValue}
            onRenameChange={setRenameValue}
            onCommitRename={onCommitRename}
            onCancelRename={() => setRenamingId(null)}
            onPointerDown={(event) => onIconPointerDown(node.id, event)}
            onDoubleClick={() => onOpenNode(node)}
            onContextMenu={(event) => onIconContextMenu(node.id, event)}
            nodeRef={(el) => {
              if (el !== null) iconNodeRefs.current.set(node.id, el);
              else iconNodeRefs.current.delete(node.id);
            }}
          />
        );
      })}
      <div ref={rubberBandRef} className={styles.rubberBand} />
      {menu !== null && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
