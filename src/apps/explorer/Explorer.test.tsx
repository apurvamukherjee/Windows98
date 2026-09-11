import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Explorer } from './Explorer';
import { useAppInstanceStore } from '../../stores/appInstanceStore';
import { DOCUMENTS_ID, ROOT_ID, RECYCLE_BIN_ID, seedFolders, useFSStore } from '../../stores/fsStore';
import { useWindowStore } from '../../stores/windowStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
});

describe('navigation', () => {
  test('boots at This PC, showing Desktop and Documents', () => {
    render(<Explorer windowId="win-1" />);
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  test('Recycle Bin lives inside Desktop, not directly under This PC', () => {
    render(<Explorer windowId="win-1" />);
    expect(screen.queryByText('Recycle Bin')).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText('Desktop'));
    expect(screen.getByText('Recycle Bin')).toBeInTheDocument();
  });

  test('double-clicking a folder navigates into it and updates the breadcrumb', () => {
    render(<Explorer windowId="win-1" />);
    fireEvent.doubleClick(screen.getByText('Documents'));

    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ currentFolderId: DOCUMENTS_ID });
    expect(screen.getByText('This PC')).toBeInTheDocument();
  });

  test('Up navigates back to the parent folder', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: DOCUMENTS_ID });
    render(<Explorer windowId="win-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Up' }));

    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ currentFolderId: ROOT_ID });
  });

  test('Up is disabled at the root', () => {
    render(<Explorer windowId="win-1" />);
    expect(screen.getByRole('button', { name: 'Up' })).toBeDisabled();
  });

  test('clicking a breadcrumb segment navigates there directly', () => {
    useFSStore.getState().createFolder(DOCUMENTS_ID, 'Deep');
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: DOCUMENTS_ID });
    render(<Explorer windowId="win-1" />);

    fireEvent.doubleClick(screen.getByText('Deep'));
    expect(useAppInstanceStore.getState().byWindowId['win-1']).not.toMatchObject({ currentFolderId: ROOT_ID });

    fireEvent.click(screen.getByText('This PC'));
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toMatchObject({ currentFolderId: ROOT_ID });
  });
});

describe('CRUD', () => {
  test('New Folder creates a folder in the current directory, selected', () => {
    render(<Explorer windowId="win-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'New Folder' }));

    // Two matches now: the toolbar button itself, and the newly created item.
    expect(screen.getAllByText('New Folder')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Rename' })).toBeEnabled();
  });

  test('Rename and Delete are disabled with nothing selected', () => {
    render(<Explorer windowId="win-1" />);
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  test('selecting an item and renaming it commits on Enter', () => {
    render(<Explorer windowId="win-1" />);
    fireEvent.click(screen.getByText('Documents'));
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    const input = screen.getByDisplayValue('Documents');
    fireEvent.change(input, { target: { value: 'My Docs' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('My Docs')).toBeInTheDocument();
  });

  test('Delete moves the selected item to the Recycle Bin', () => {
    const id = useFSStore.getState().createFolder(DOCUMENTS_ID, 'Temp');
    render(<Explorer windowId="win-1" />);
    fireEvent.doubleClick(screen.getByText('Documents'));
    fireEvent.click(screen.getByText('Temp'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(useFSStore.getState().nodes[id]).toMatchObject({ parentId: RECYCLE_BIN_ID });
  });
});

describe('Recycle Bin', () => {
  test('shows "Empty Recycle Bin" instead of New Folder/Rename/Delete while browsing it', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: RECYCLE_BIN_ID });
    render(<Explorer windowId="win-1" />);

    expect(screen.getByRole('button', { name: 'Empty Recycle Bin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Folder' })).not.toBeInTheDocument();
  });

  test('Empty Recycle Bin is disabled when it has nothing in it', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: RECYCLE_BIN_ID });
    render(<Explorer windowId="win-1" />);

    expect(screen.getByRole('button', { name: 'Empty Recycle Bin' })).toBeDisabled();
  });

  test('Empty Recycle Bin permanently deletes its contents', () => {
    const id = useFSStore.getState().createFile(RECYCLE_BIN_ID, 'trash.txt', 'text', '');
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: RECYCLE_BIN_ID });
    render(<Explorer windowId="win-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Empty Recycle Bin' }));

    expect(useFSStore.getState().nodes[id]).toBeUndefined();
  });
});

describe('opening files', () => {
  test('double-clicking a text file opens it in Notepad', () => {
    useFSStore.getState().createFile(DOCUMENTS_ID, 'report.txt', 'text', 'Q3 numbers');
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: DOCUMENTS_ID });
    render(<Explorer windowId="win-1" />);

    fireEvent.doubleClick(screen.getByText('report.txt'));

    const state = useWindowStore.getState();
    expect(state.windows[state.zOrder.at(-1) ?? '']).toMatchObject({ appId: 'notepad' });
  });
});

describe('view mode', () => {
  test('toggling to list view still renders the same children', () => {
    render(<Explorer windowId="win-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Icon view' })).toBeInTheDocument();
  });
});
