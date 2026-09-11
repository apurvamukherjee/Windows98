import { useEffect, useRef, useState } from 'react';
import type { AppComponentProps } from '../APP_REGISTRY';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { useFSStore, ROOT_ID, RECYCLE_BIN_ID } from '../../stores/fsStore';
import { useEasterEggStore } from '../../stores/easterEggStore';
import { openFile } from '../openFile';
import { openFolderInExplorer } from '../openFolderInExplorer';
import { runCommand } from './commands';
import { formatCwdPath } from './pathResolve';
import styles from './Terminal.module.css';

const MATRIX_DURATION_MS = 2500;
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソ';

function randomMatrixColumn(rows: number): string {
  return Array.from({ length: rows }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join('\n');
}

interface LogEntry {
  path: string;
  input: string;
  lines: string[];
}

const MAX_LOG_ENTRIES = 200;

function isLogEntry(value: unknown): value is LogEntry {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.path === 'string' && typeof candidate.input === 'string' && Array.isArray(candidate.lines);
}

function isLogArray(value: unknown): value is LogEntry[] {
  return Array.isArray(value) && value.every(isLogEntry);
}

// A stable reference (never mutated) so the "no log yet" fallback doesn't
// change identity every render — otherwise the scroll effect below, keyed
// on `log`, would fire on every render rather than only when it changes.
const EMPTY_LOG: LogEntry[] = [];

export function Terminal({ windowId }: AppComponentProps): React.JSX.Element {
  const instance = useAppInstanceStore((state) => state.byWindowId[windowId]);
  const patchInstanceState = useAppInstanceStore((state) => state.patchInstanceState);
  const cwd = typeof instance?.cwd === 'string' ? instance.cwd : ROOT_ID;
  const log = isLogArray(instance?.log) ? instance.log : EMPTY_LOG;

  const nodes = useFSStore((state) => state.nodes);
  const createFolder = useFSStore((state) => state.createFolder);
  const createFile = useFSStore((state) => state.createFile);
  const updateFileContent = useFSStore((state) => state.updateFileContent);
  const moveNode = useFSStore((state) => state.moveNode);

  const [inputValue, setInputValue] = useState('');
  const [matrixColumns, setMatrixColumns] = useState<string[] | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (matrixColumns === null) return;
    const interval = setInterval(() => {
      setMatrixColumns((columns) => columns?.map(() => randomMatrixColumn(14)) ?? null);
    }, 120);
    const timeout = setTimeout(() => setMatrixColumns(null), MATRIX_DURATION_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // Re-runs only when the effect toggles on/off, not on every column tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixColumns !== null]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

  const promptPath = formatCwdPath(nodes, cwd, ROOT_ID);

  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const raw = inputValue;
    setInputValue('');
    if (raw.trim() !== '') {
      historyRef.current.push(raw);
    }
    historyIndexRef.current = null;

    const result = runCommand(raw, {
      nodes,
      cwd,
      rootId: ROOT_ID,
      recycleBinId: RECYCLE_BIN_ID,
      createFolder,
      createFile,
      updateFileContent,
      moveNode,
      openFile,
      openFolder: openFolderInExplorer,
    });

    if (result.easterEgg === 'matrix') setMatrixColumns(Array.from({ length: 16 }, () => randomMatrixColumn(14)));
    if (result.easterEgg === 'bsod') useEasterEggStore.getState().triggerBsod();

    if (result.clear === true) {
      patchInstanceState(windowId, { log: [], cwd: result.newCwd ?? cwd });
      return;
    }

    const entry: LogEntry = { path: promptPath, input: raw, lines: result.output };
    const nextLog = [...log, entry].slice(-MAX_LOG_ENTRIES);
    patchInstanceState(windowId, {
      log: nextLog,
      ...(result.newCwd !== undefined ? { cwd: result.newCwd } : {}),
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const history = historyRef.current;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndexRef.current === null ? history.length - 1 : Math.max(0, historyIndexRef.current - 1);
      historyIndexRef.current = nextIndex;
      setInputValue(history[nextIndex] ?? '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndexRef.current === null) return;
      const nextIndex = historyIndexRef.current + 1;
      if (nextIndex >= history.length) {
        historyIndexRef.current = null;
        setInputValue('');
      } else {
        historyIndexRef.current = nextIndex;
        setInputValue(history[nextIndex] ?? '');
      }
    }
  };

  return (
    <div className={styles.wrapper} onClick={() => inputRef.current?.focus()}>
      {matrixColumns !== null && (
        <div className={styles.matrixOverlay} data-testid="matrix-overlay" aria-hidden="true">
          {matrixColumns.map((column, index) => (
            <pre key={index} className={styles.matrixColumn}>
              {column}
            </pre>
          ))}
        </div>
      )}
      <div className={styles.scrollback} ref={scrollRef}>
        {log.map((entry, index) => (
          <div key={index} className={styles.entry}>
            <div>
              {entry.path}$ {entry.input}
            </div>
            {entry.lines.map((line, lineIndex) => (
              <div key={lineIndex}>{line}</div>
            ))}
          </div>
        ))}
      </div>
      <form className={styles.promptLine} onSubmit={onSubmit}>
        <span className={styles.prompt}>{promptPath}$</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}
