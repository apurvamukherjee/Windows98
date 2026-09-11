import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { initPersistence, loadPersistedState, saveSnapshot, STORAGE_KEY } from './persist';
import { useFSStore, DOCUMENTS_ID, seedFolders } from '../stores/fsStore';
import { useWindowStore } from '../stores/windowStore';
import { useDesktopStore, DEFAULT_WALLPAPER } from '../stores/desktopStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import { useTaskbarStore } from '../stores/taskbarStore';

function resetAllStores(): void {
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
  useDesktopStore.setState({ iconPositions: {}, wallpaper: DEFAULT_WALLPAPER });
  useAppInstanceStore.setState({ byWindowId: {} });
  useTaskbarStore.setState({ pinnedAppIds: [] });
}

beforeEach(() => {
  localStorage.clear();
  resetAllStores();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('save/load round trip', () => {
  test('restores fs, window, desktop, and app-instance data exactly', () => {
    const fileId = useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', 'hi');
    const windowId = useWindowStore.getState().openWindow('notepad', { w: 380, h: 260 });
    useAppInstanceStore.getState().patchInstanceState(windowId, { fileId, content: 'hi' });
    useDesktopStore.getState().setIconPosition(fileId, 80, 90);
    useDesktopStore.getState().setWallpaper('#800080');
    useTaskbarStore.getState().pinApp('notepad');

    saveSnapshot();
    resetAllStores();
    const restored = loadPersistedState();

    expect(restored).toBe(true);
    expect(useFSStore.getState().nodes[fileId]).toMatchObject({ name: 'a.txt', content: 'hi' });
    expect(useWindowStore.getState().windows[windowId]).toMatchObject({ appId: 'notepad' });
    expect(useDesktopStore.getState().iconPositions[fileId]).toEqual({ x: 80, y: 90 });
    expect(useDesktopStore.getState().wallpaper).toBe('#800080');
    expect(useAppInstanceStore.getState().byWindowId[windowId]).toMatchObject({ fileId, content: 'hi' });
    expect(useTaskbarStore.getState().pinnedAppIds).toEqual(['notepad']);
  });

  test('restores id counters, so new ids never collide with restored ones', () => {
    useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    saveSnapshot();
    resetAllStores();
    loadPersistedState();

    const newId = useFSStore.getState().createFile(DOCUMENTS_ID, 'b.txt', 'text', '');
    expect(newId).not.toBe('file-0');
  });
});

describe('loadPersistedState failure modes', () => {
  test('returns false and leaves stores untouched when nothing is saved', () => {
    const before = useFSStore.getState();
    expect(loadPersistedState()).toBe(false);
    expect(useFSStore.getState()).toBe(before);
  });

  test('returns false on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadPersistedState()).toBe(false);
  });

  test('returns false on a schema version mismatch', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 999, fs: {}, windows: {}, desktop: {}, appInstances: {}, taskbar: {} }),
    );
    expect(loadPersistedState()).toBe(false);
  });

  test('returns false when the envelope is missing required sections', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, fs: {} }));
    expect(loadPersistedState()).toBe(false);
  });
});

describe('initPersistence', () => {
  test('debounces saves: rapid changes within the window produce one write', () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { cleanup } = initPersistence();

    useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    useFSStore.getState().createFile(DOCUMENTS_ID, 'b.txt', 'text', '');
    useFSStore.getState().createFile(DOCUMENTS_ID, 'c.txt', 'text', '');

    expect(setItemSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    cleanup();
  });

  test('flushes synchronously on visibilitychange to hidden', () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { cleanup } = initPersistence();

    useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    expect(setItemSpy).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    cleanup();
  });

  test('cleanup stops further scheduled saves', () => {
    vi.useFakeTimers();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { cleanup } = initPersistence();
    cleanup();

    useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', '');
    vi.advanceTimersByTime(1000);

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
