import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Desktop } from './Desktop';
import { useDesktopStore } from '../../stores/desktopStore';
import { useFSStore, DESKTOP_ID, RECYCLE_BIN_ID, seedFolders } from '../../stores/fsStore';
import { useWindowStore } from '../../stores/windowStore';
import { useAppInstanceStore } from '../../stores/appInstanceStore';

beforeEach(() => {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useDesktopStore.setState({ iconPositions: {} });
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('rendering', () => {
  test('shows icons for items on the desktop', () => {
    useFSStore.getState().createFolder(DESKTOP_ID, 'My Stuff');
    render(<Desktop />);
    expect(screen.getByText('My Stuff')).toBeInTheDocument();
  });

  test('does not show items that live in other folders', () => {
    useFSStore.getState().createFile('documents', 'notes.txt', 'text', '');
    render(<Desktop />);
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
  });
});

describe('opening', () => {
  test('double-clicking a desktop folder opens an Explorer window scoped to it', () => {
    const folderId = useFSStore.getState().createFolder(DESKTOP_ID, 'My Stuff');
    render(<Desktop />);

    fireEvent.doubleClick(screen.getByText('My Stuff'));

    const state = useWindowStore.getState();
    const windowId = state.zOrder.at(-1);
    expect(state.windows[windowId ?? '']).toMatchObject({ appId: 'explorer' });
    expect(useAppInstanceStore.getState().byWindowId[windowId ?? '']).toMatchObject({ currentFolderId: folderId });
  });

  test('double-clicking a desktop file opens it via the registered app', () => {
    useFSStore.getState().createFile(DESKTOP_ID, 'readme.txt', 'text', 'hi');
    render(<Desktop />);

    fireEvent.doubleClick(screen.getByText('readme.txt'));

    const state = useWindowStore.getState();
    expect(state.windows[state.zOrder.at(-1) ?? '']).toMatchObject({ appId: 'notepad' });
  });
});

describe('dragging an icon', () => {
  test('a plain click (no movement) selects without writing a position', () => {
    useFSStore.getState().createFolder(DESKTOP_ID, 'A');
    render(<Desktop />);
    const before = useDesktopStore.getState();

    const icon = screen.getByText('A');
    fireEvent.pointerDown(icon, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointerup', { clientX: 10, clientY: 10 }));

    expect(useDesktopStore.getState()).toBe(before);
  });

  test('dragging with real movement snaps to the grid and commits a position', () => {
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(document.body);
    const id = useFSStore.getState().createFolder(DESKTOP_ID, 'A');
    render(<Desktop />);

    const icon = screen.getByText('A');
    fireEvent.pointerDown(icon, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 200, clientY: 130 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 200, clientY: 130 }));

    expect(useDesktopStore.getState().iconPositions[id]).toEqual({ x: 160, y: 90 });
  });

  test('dropping an icon onto an open Explorer window moves it there instead of repositioning', () => {
    const explorerWindowId = 'win-1';
    useWindowStore.setState({
      windows: {
        [explorerWindowId]: {
          id: explorerWindowId,
          appId: 'explorer',
          x: 0,
          y: 0,
          w: 400,
          h: 300,
          minimized: false,
          maximized: false,
          snapped: null,
          restoreRect: null,
        },
      },
      zOrder: [explorerWindowId],
      nextWindowSeq: 1,
    });
    useAppInstanceStore.getState().patchInstanceState(explorerWindowId, { currentFolderId: 'documents' });

    const explorerEl = document.createElement('div');
    explorerEl.setAttribute('data-testid', `window-${explorerWindowId}`);
    document.body.appendChild(explorerEl);
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(explorerEl);

    const id = useFSStore.getState().createFolder(DESKTOP_ID, 'A');
    render(<Desktop />);

    const icon = screen.getByText('A');
    fireEvent.pointerDown(icon, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent(window, new PointerEvent('pointermove', { clientX: 200, clientY: 130 }));
    fireEvent(window, new PointerEvent('pointerup', { clientX: 200, clientY: 130 }));

    expect(useFSStore.getState().nodes[id]).toMatchObject({ parentId: 'documents' });
    expect(useDesktopStore.getState().iconPositions[id]).toBeUndefined();
  });
});

describe('context menu', () => {
  test('right-clicking the desktop surface opens a menu with New Folder, which creates one', () => {
    const { container } = render(<Desktop />);
    fireEvent.contextMenu(container.firstChild as Element, { clientX: 50, clientY: 50 });

    expect(screen.getByRole('menuitem', { name: 'New Folder' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'New Folder' }));

    expect(screen.getByText('New Folder')).toBeInTheDocument();
  });

  test('right-clicking an icon offers Delete, which moves it to the Recycle Bin', () => {
    const id = useFSStore.getState().createFolder(DESKTOP_ID, 'A');
    render(<Desktop />);

    fireEvent.contextMenu(screen.getByText('A'), { clientX: 10, clientY: 10 });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(useFSStore.getState().nodes[id]).toMatchObject({ parentId: RECYCLE_BIN_ID });
  });

  test('the background menu offers wallpaper presets that update the desktop store', () => {
    const { container } = render(<Desktop />);
    fireEvent.contextMenu(container.firstChild as Element, { clientX: 50, clientY: 50 });

    fireEvent.click(screen.getByRole('menuitem', { name: 'Wallpaper: Navy' }));

    expect(useDesktopStore.getState().wallpaper).toBe('#000080');
  });
});
