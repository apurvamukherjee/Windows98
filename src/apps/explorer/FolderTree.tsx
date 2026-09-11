import { useFSStore, ROOT_ID } from '../../stores/fsStore';
import { getChildren } from '../../fs/fsUtils';
import styles from './FolderTree.module.css';

interface FolderTreeProps {
  currentFolderId: string;
  onNavigate: (id: string) => void;
}

interface FolderTreeNodeProps extends FolderTreeProps {
  id: string;
  depth: number;
}

function FolderTreeNode({ id, depth, currentFolderId, onNavigate }: FolderTreeNodeProps): React.JSX.Element | null {
  const nodes = useFSStore((state) => state.nodes);
  const node = nodes[id];
  if (node === undefined || node.kind !== 'folder') return null;
  const childFolders = getChildren(nodes, id).filter((child) => child.kind === 'folder');

  return (
    <div>
      <div
        className={`${styles.row} ${id === currentFolderId ? styles.rowActive : ''}`}
        style={{ paddingLeft: 4 + depth * 12 }}
        onClick={() => onNavigate(id)}
      >
        📁 {node.name}
      </div>
      {childFolders.map((child) => (
        <FolderTreeNode key={child.id} id={child.id} depth={depth + 1} currentFolderId={currentFolderId} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function FolderTree({ currentFolderId, onNavigate }: FolderTreeProps): React.JSX.Element {
  return (
    <div className={styles.tree}>
      <FolderTreeNode id={ROOT_ID} depth={0} currentFolderId={currentFolderId} onNavigate={onNavigate} />
    </div>
  );
}
