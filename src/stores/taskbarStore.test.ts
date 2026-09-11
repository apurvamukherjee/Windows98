import { beforeEach, describe, expect, test } from 'vitest';
import { useTaskbarStore } from './taskbarStore';

beforeEach(() => {
  useTaskbarStore.setState({ pinnedAppIds: [] });
});

describe('pinApp', () => {
  test('adds an app id', () => {
    useTaskbarStore.getState().pinApp('notepad');
    expect(useTaskbarStore.getState().pinnedAppIds).toEqual(['notepad']);
  });

  test('is idempotent (same reference) when already pinned', () => {
    useTaskbarStore.getState().pinApp('notepad');
    const before = useTaskbarStore.getState();
    useTaskbarStore.getState().pinApp('notepad');
    expect(useTaskbarStore.getState()).toBe(before);
  });
});

describe('unpinApp', () => {
  test('removes an app id', () => {
    useTaskbarStore.getState().pinApp('notepad');
    useTaskbarStore.getState().unpinApp('notepad');
    expect(useTaskbarStore.getState().pinnedAppIds).toEqual([]);
  });

  test('is a no-op (same reference) when not pinned', () => {
    const before = useTaskbarStore.getState();
    useTaskbarStore.getState().unpinApp('notepad');
    expect(useTaskbarStore.getState()).toBe(before);
  });
});
