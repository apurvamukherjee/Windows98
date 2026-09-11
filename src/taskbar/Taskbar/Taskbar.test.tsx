import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Taskbar } from './Taskbar';
import { useWindowStore, type WindowState } from '../../stores/windowStore';
import { useTaskbarStore } from '../../stores/taskbarStore';

function seed(id: string, overrides: Partial<WindowState> = {}): WindowState {
  return {
    id,
    appId: id,
    x: 0,
    y: 0,
    w: 300,
    h: 200,
    minimized: false,
    maximized: false,
    snapped: null,
    restoreRect: null,
    ...overrides,
  };
}

beforeEach(() => {
  useWindowStore.setState({
    windows: { a: seed('a'), b: seed('b') },
    zOrder: ['a', 'b'],
    nextWindowSeq: 0,
  });
  useTaskbarStore.setState({ pinnedAppIds: [] });
});

describe('Taskbar', () => {
  test('marks the topmost visible window as active', () => {
    render(<Taskbar />);
    expect(screen.getByText('b').className).toMatch(/active/);
    expect(screen.getByText('a').className).not.toMatch(/active/);
  });

  test('clicking the active window minimizes it', () => {
    render(<Taskbar />);
    fireEvent.click(screen.getByText('b'));
    expect(useWindowStore.getState().windows.b).toMatchObject({ minimized: true });
  });

  test('clicking an inactive, visible window focuses it', () => {
    render(<Taskbar />);
    fireEvent.click(screen.getByText('a'));
    expect(useWindowStore.getState().zOrder).toEqual(['b', 'a']);
  });

  test('clicking a minimized window restores and focuses it', () => {
    useWindowStore.getState().minimize('a');
    render(<Taskbar />);

    fireEvent.click(screen.getByText('a'));

    const state = useWindowStore.getState();
    expect(state.windows.a).toMatchObject({ minimized: false });
    expect(state.zOrder).toEqual(['b', 'a']);
  });
});

describe('Start menu', () => {
  test('Start button toggles the menu open and closed', () => {
    render(<Taskbar />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('launching an app opens a new focused window and closes the menu', () => {
    render(<Taskbar />);
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Notepad/ }));

    const state = useWindowStore.getState();
    const newId = state.zOrder.at(-1);
    expect(newId).toBeDefined();
    expect(state.windows[newId ?? '']).toMatchObject({ appId: 'notepad' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('a pointerdown outside the menu closes it', () => {
    render(<Taskbar />);
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('pinning', () => {
  test('right-clicking a running window button offers Pin to Taskbar', () => {
    render(<Taskbar />);
    fireEvent.contextMenu(screen.getByText('a'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pin to Taskbar' }));

    expect(useTaskbarStore.getState().pinnedAppIds).toEqual(['a']);
  });

  test('a pinned app with no running window shows a launcher button; launching it opens a window', () => {
    useTaskbarStore.getState().pinApp('notepad');
    render(<Taskbar />);

    expect(screen.getByText(/Notepad/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Notepad/));

    const state = useWindowStore.getState();
    expect(state.windows[state.zOrder.at(-1) ?? '']).toMatchObject({ appId: 'notepad' });
  });

  test('a pinned app that is already running does not get a duplicate launcher button', () => {
    useTaskbarStore.getState().pinApp('a');
    render(<Taskbar />);
    expect(screen.getAllByText('a')).toHaveLength(1);
  });

  test('unpinning removes the launcher button', () => {
    useTaskbarStore.getState().pinApp('notepad');
    render(<Taskbar />);
    fireEvent.contextMenu(screen.getByText(/Notepad/));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unpin from Taskbar' }));

    expect(screen.queryByText(/Notepad/)).not.toBeInTheDocument();
  });
});
