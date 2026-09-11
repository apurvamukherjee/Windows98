import styles from './DesktopIcon.module.css';

interface DesktopIconProps {
  id: string;
  name: string;
  glyph: string;
  badge?: boolean;
  x: number;
  y: number;
  selected: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onPointerDown: (event: React.PointerEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  nodeRef: (el: HTMLDivElement | null) => void;
}

export function DesktopIcon({
  id,
  name,
  glyph,
  badge = false,
  x,
  y,
  selected,
  renaming,
  renameValue,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onPointerDown,
  onDoubleClick,
  onContextMenu,
  nodeRef,
}: DesktopIconProps): React.JSX.Element {
  return (
    <div
      ref={nodeRef}
      data-desktop-icon-id={id}
      className={`${styles.icon} ${selected ? styles.selected : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <span className={styles.glyph}>
        {glyph}
        {badge && <span className={styles.badge} aria-label="non-empty" />}
      </span>
      {renaming ? (
        <input
          className={styles.renameInput}
          value={renameValue}
          autoFocus
          onFocus={(event) => event.target.select()}
          onPointerDown={(event) => event.stopPropagation()}
          onChange={(event) => onRenameChange(event.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onCommitRename();
            if (event.key === 'Escape') onCancelRename();
          }}
        />
      ) : (
        <span className={styles.label}>{name}</span>
      )}
    </div>
  );
}
