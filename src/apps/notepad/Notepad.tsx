import { useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { useFSStore, DOCUMENTS_ID } from '../../stores/fsStore';
import { getTextFiles } from '../../fs/fsUtils';
import styles from './Notepad.module.css';

export function Notepad({ windowId }: AppComponentProps): React.JSX.Element {
  const instance = useAppInstanceStore((state) => state.byWindowId[windowId]);
  const patchInstanceState = useAppInstanceStore((state) => state.patchInstanceState);
  const content = typeof instance?.content === 'string' ? instance.content : '';
  const fileId = typeof instance?.fileId === 'string' ? instance.fileId : undefined;

  const nodes = useFSStore((state) => state.nodes);
  const createFile = useFSStore((state) => state.createFile);
  const updateFileContent = useFSStore((state) => state.updateFileContent);

  const [dialog, setDialog] = useState<'none' | 'open' | 'save-as'>('none');
  const [saveAsName, setSaveAsName] = useState('');

  const onSave = (): void => {
    if (fileId !== undefined) {
      updateFileContent(fileId, content);
      return;
    }
    setSaveAsName('');
    setDialog('save-as');
  };

  const onConfirmSaveAs = (): void => {
    const name = saveAsName.trim();
    if (name === '') return;
    const newId = createFile(DOCUMENTS_ID, name, 'text', content);
    patchInstanceState(windowId, { fileId: newId });
    setDialog('none');
  };

  const onOpenFile = (openedId: string, openedContent: string): void => {
    patchInstanceState(windowId, { fileId: openedId, content: openedContent });
    setDialog('none');
  };

  const textFiles = getTextFiles(nodes, DOCUMENTS_ID);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolbarButton} onClick={() => setDialog('open')}>
          Open
        </button>
        <button type="button" className={styles.toolbarButton} onClick={onSave}>
          Save
        </button>
      </div>
      <textarea
        className={styles.textarea}
        value={content}
        onChange={(event) => patchInstanceState(windowId, { content: event.target.value })}
        spellCheck={false}
        aria-label="Notepad document"
      />
      {dialog === 'open' && (
        <div className={styles.dialog}>
          <span className={styles.dialogTitle}>Open</span>
          <ul className={styles.fileList}>
            {textFiles.length === 0 && <li>No documents saved yet.</li>}
            {textFiles.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className={styles.fileListItem}
                  onClick={() => onOpenFile(file.id, file.content)}
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.toolbarButton} onClick={() => setDialog('none')}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {dialog === 'save-as' && (
        <div className={styles.dialog}>
          <span className={styles.dialogTitle}>Save As</span>
          <input
            className={styles.nameInput}
            value={saveAsName}
            onChange={(event) => setSaveAsName(event.target.value)}
            placeholder="filename.txt"
            aria-label="File name"
            autoFocus
          />
          <div className={styles.dialogActions}>
            <button type="button" className={styles.toolbarButton} onClick={onConfirmSaveAs}>
              Save
            </button>
            <button type="button" className={styles.toolbarButton} onClick={() => setDialog('none')}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
