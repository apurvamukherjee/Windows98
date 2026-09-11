import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Terminal } from './Terminal';
import { Explorer } from '../explorer/Explorer';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { DOCUMENTS_ID, RECYCLE_BIN_ID, seedFolders, useFSStore } from '../../stores/fsStore';
import { useWindowStore } from '../../stores/windowStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
});

function typeCommand(command: string): void {
  const input = screen.getByLabelText('Terminal input');
  fireEvent.change(input, { target: { value: command } });
  fireEvent.submit(input.closest('form') as HTMLFormElement);
}

describe('basic commands', () => {
  test('boots at the root prompt', () => {
    render(<Terminal windowId="win-1" />);
    expect(screen.getByText('/$')).toBeInTheDocument();
  });

  test('cd updates the prompt and persists cwd in instance state', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('cd Documents');
    expect(screen.getByText('/Documents$')).toBeInTheDocument();
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ cwd: DOCUMENTS_ID });
  });

  test('a submitted command is recorded in the scrollback with its prompt', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('help');
    expect(screen.getByText('/$ help')).toBeInTheDocument();
    expect(screen.getByText(/Commands: ls, cd, cat/)).toBeInTheDocument();
  });

  test('clear wipes the scrollback', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('help');
    typeCommand('clear');
    expect(screen.queryByText('/$ help')).not.toBeInTheDocument();
  });

  test('ArrowUp recalls the previous command into the input', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('ls');
    const input = screen.getByLabelText('Terminal input');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('ls');
  });
});

describe('mkdir/touch create real FS nodes', () => {
  test('mkdir in Documents creates a folder visible in the FS store', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('cd Documents');
    typeCommand('mkdir Reports');

    const created = Object.values(useFSStore.getState().nodes).find((n) => n.name === 'Reports');
    expect(created).toMatchObject({ kind: 'folder', parentId: DOCUMENTS_ID });
  });
});

describe('live cross-app sync', () => {
  test('deleting a file via `rm` in the Terminal removes it from an already-open Explorer window', () => {
    const fileId = useFSStore.getState().createFile(DOCUMENTS_ID, 'shared.txt', 'text', 'hi');

    render(
      <>
        <Terminal windowId="term-1" />
        <Explorer windowId="explorer-1" />
      </>,
    );

    // Navigate the already-rendered Explorer into Documents so the file is visible.
    fireEvent.doubleClick(screen.getByRole('button', { name: /Documents/ }));
    expect(screen.getByText('shared.txt')).toBeInTheDocument();

    // Delete it from the Terminal.
    fireEvent.change(screen.getByLabelText('Terminal input'), { target: { value: 'cd Documents' } });
    fireEvent.submit(screen.getByLabelText('Terminal input').closest('form') as HTMLFormElement);
    fireEvent.change(screen.getByLabelText('Terminal input'), { target: { value: 'rm shared.txt' } });
    fireEvent.submit(screen.getByLabelText('Terminal input').closest('form') as HTMLFormElement);

    // Both stores are shared — Explorer re-renders from the same fsStore change.
    expect(screen.queryByText('shared.txt')).not.toBeInTheDocument();
    expect(useFSStore.getState().nodes[fileId]).toMatchObject({ parentId: RECYCLE_BIN_ID });
  });

  test('`open` on a text file opens it in a real Notepad window', () => {
    useFSStore.getState().createFile(DOCUMENTS_ID, 'notes.txt', 'text', 'hello');
    render(<Terminal windowId="win-1" />);

    typeCommand('cd Documents');
    typeCommand('open notes.txt');

    const state = useWindowStore.getState();
    expect(state.windows[state.zOrder.at(-1) ?? '']).toMatchObject({ appId: 'notepad' });
  });

  test('`open` on a folder opens a real Explorer window scoped to it', () => {
    render(<Terminal windowId="win-1" />);
    typeCommand('open Documents');

    const state = useWindowStore.getState();
    const windowId = state.zOrder.at(-1);
    expect(state.windows[windowId ?? '']).toMatchObject({ appId: 'explorer' });
    expect(useAppInstanceStore.getState().byWindowId[windowId ?? '']).toMatchObject({ currentFolderId: DOCUMENTS_ID });
  });
});

describe('surviving minimize/restore', () => {
  test('scrollback and cwd persist in the app-instance store across a remount', () => {
    const { unmount } = render(<Terminal windowId="win-1" />);
    typeCommand('cd Documents');
    typeCommand('help');
    unmount();

    render(<Terminal windowId="win-1" />);
    expect(screen.getByText('/Documents$')).toBeInTheDocument();
    expect(screen.getByText('/Documents$ help')).toBeInTheDocument();
  });
});
