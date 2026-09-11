import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Paint } from './Paint';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { DOCUMENTS_ID, seedFolders, useFSStore } from '../../stores/fsStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
});

describe('tools', () => {
  test('pencil is selected by default, and clicking another tool switches it', () => {
    render(<Paint windowId="win-1" />);
    expect(screen.getByRole('button', { name: 'pencil' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'fill' }));

    expect(screen.getByRole('button', { name: 'fill' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'pencil' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('changing the color input updates its value', () => {
    render(<Paint windowId="win-1" />);
    const colorInput = screen.getByLabelText('Color');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    expect(colorInput).toHaveValue('#ff0000');
  });
});

describe('Save', () => {
  test('Save with no open file prompts Save As, then creates a real image FileNode', () => {
    render(<Paint windowId="win-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.change(screen.getByLabelText('File name'), { target: { value: 'drawing.png' } });
    const saveButtons = screen.getAllByRole('button', { name: 'Save' });
    fireEvent.click(saveButtons[saveButtons.length - 1] as HTMLElement);

    const nodes = useFSStore.getState().nodes;
    const saved = Object.values(nodes).find((n) => n.kind === 'file' && n.name === 'drawing.png');
    expect(saved).toMatchObject({ kind: 'file', fileType: 'image', parentId: DOCUMENTS_ID });

    const windowId = 'win-1';
    const fileId = useAppInstanceStore.getState().byWindowId[windowId]?.fileId;
    expect(fileId).toBe(saved?.id);
  });

  test('Save with an already-open file overwrites it directly, no prompt', () => {
    const fileId = useFSStore.getState().createFile(DOCUMENTS_ID, 'existing.png', 'image', 'data:image/png;base64,old');
    useAppInstanceStore.getState().patchInstanceState('win-1', { fileId });
    render(<Paint windowId="win-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByLabelText('File name')).not.toBeInTheDocument();
    // jsdom has no real canvas backing, so we can't assert the exact bytes —
    // only that the save path was taken directly, without a prompt.
  });
});

describe('Open', () => {
  test('lists saved images and loads the chosen one', () => {
    useFSStore.getState().createFile(DOCUMENTS_ID, 'photo.png', 'image', 'data:image/png;base64,abc');
    render(<Paint windowId="win-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByText('photo.png'));

    const node = Object.values(useFSStore.getState().nodes).find((n) => n.kind === 'file' && n.name === 'photo.png');
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ fileId: node?.id });
  });

  test('shows an empty state when there are no saved images', () => {
    render(<Paint windowId="win-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('No images saved yet.')).toBeInTheDocument();
  });
});
