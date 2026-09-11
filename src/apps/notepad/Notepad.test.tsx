import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Notepad } from './Notepad';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { DOCUMENTS_ID, seedFolders, useFSStore } from '../../stores/fsStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
});

describe('editing', () => {
  test('typing updates the textarea value and persists it in the instance store', () => {
    render(<Notepad windowId="win-1" />);
    const textarea = screen.getByLabelText('Notepad document');

    fireEvent.change(textarea, { target: { value: 'hello world' } });

    expect(textarea).toHaveValue('hello world');
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ content: 'hello world' });
  });

  test('two windows keep independent content', () => {
    render(
      <>
        <Notepad windowId="win-1" />
        <Notepad windowId="win-2" />
      </>,
    );
    const [first, second] = screen.getAllByLabelText('Notepad document');
    if (first === undefined || second === undefined) throw new Error('expected two textareas');

    fireEvent.change(first, { target: { value: 'from window 1' } });

    expect(first).toHaveValue('from window 1');
    expect(second).toHaveValue('');
  });
});

describe('Save', () => {
  test('Save with no open file prompts Save As, then creates a real FileNode', () => {
    render(<Notepad windowId="win-1" />);
    fireEvent.change(screen.getByLabelText('Notepad document'), { target: { value: 'draft' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.change(screen.getByLabelText('File name'), { target: { value: 'todo.txt' } });
    const saveButtons = screen.getAllByRole('button', { name: 'Save' });
    fireEvent.click(saveButtons[saveButtons.length - 1] as HTMLElement);

    const nodes = useFSStore.getState().nodes;
    const saved = Object.values(nodes).find((n) => n.kind === 'file' && n.name === 'todo.txt');
    expect(saved).toMatchObject({ parentId: DOCUMENTS_ID, content: 'draft' });
  });

  test('Save with an already-open file overwrites it directly, no prompt', () => {
    const fileId = useFSStore.getState().createFile(DOCUMENTS_ID, 'existing.txt', 'text', 'old');
    useAppInstanceStore.getState().patchInstanceState('win-1', { fileId, content: 'new' });
    render(<Notepad windowId="win-1" />);

    fireEvent.click(screen.getByText('Save'));

    expect(screen.queryByLabelText('File name')).not.toBeInTheDocument();
    expect(useFSStore.getState().nodes[fileId]).toMatchObject({ content: 'new' });
  });
});

describe('Open', () => {
  test('lists saved text files and loads the chosen one into the editor', () => {
    useFSStore.getState().createFile(DOCUMENTS_ID, 'report.txt', 'text', 'Q3 numbers');
    render(<Notepad windowId="win-1" />);

    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByText('report.txt'));

    expect(screen.getByLabelText('Notepad document')).toHaveValue('Q3 numbers');
  });

  test('shows an empty state when there are no saved documents', () => {
    render(<Notepad windowId="win-1" />);
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('No documents saved yet.')).toBeInTheDocument();
  });
});
