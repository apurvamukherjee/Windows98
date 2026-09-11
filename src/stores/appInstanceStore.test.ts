import { beforeEach, describe, expect, test } from 'vitest';
import { useAppInstanceStore } from './appInstanceStore';

beforeEach(() => {
  useAppInstanceStore.setState({ byWindowId: {} });
});

describe('patchInstanceState', () => {
  test('creates a new entry for a window that has none yet', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { fileId: 'file-0' });
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toEqual({ fileId: 'file-0' });
  });

  test('merges into an existing entry without dropping other fields', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { fileId: 'file-0' });
    useAppInstanceStore.getState().patchInstanceState('win-1', { content: 'hi' });

    expect(useAppInstanceStore.getState().byWindowId['win-1']).toEqual({ fileId: 'file-0', content: 'hi' });
  });

  test('does not affect other windows entries by reference', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { a: 1 });
    useAppInstanceStore.getState().patchInstanceState('win-2', { b: 2 });
    const before = useAppInstanceStore.getState().byWindowId['win-1'];

    useAppInstanceStore.getState().patchInstanceState('win-2', { b: 3 });

    expect(useAppInstanceStore.getState().byWindowId['win-1']).toBe(before);
  });
});

describe('clearInstanceState', () => {
  test('removes the entry for a window', () => {
    useAppInstanceStore.getState().patchInstanceState('win-1', { fileId: 'file-0' });
    useAppInstanceStore.getState().clearInstanceState('win-1');
    expect(useAppInstanceStore.getState().byWindowId['win-1']).toBeUndefined();
  });

  test('is a no-op for a window with no entry', () => {
    const before = useAppInstanceStore.getState();
    useAppInstanceStore.getState().clearInstanceState('missing');
    expect(useAppInstanceStore.getState()).toBe(before);
  });
});
