import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { resetPersistedState, saveSnapshot, STORAGE_KEY } from './persist';
import { useFSStore, DOCUMENTS_ID, seedFolders } from '../stores/fsStore';

// Kept in its own file, deliberately: resetPersistedState sets a
// module-level "reset in progress" flag that (correctly, for production —
// the page is about to be destroyed by reload()) never clears itself. In a
// shared test file that would poison every later test's ability to save.
// Vitest isolates modules per file by default, so this file gets its own
// copy of persist.ts's module state.

beforeEach(() => {
  localStorage.clear();
  useFSStore.setState({ nodes: seedFolders(), nextNodeSeq: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('clears storage and suppresses any save that fires afterward (e.g. a lingering beforeunload flush)', () => {
  useFSStore.getState().createFile(DOCUMENTS_ID, 'a.txt', 'text', 'keep me?');
  saveSnapshot();
  expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

  const reload = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  });

  resetPersistedState();
  expect(reload).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

  // Simulates a beforeunload flush firing after reset, from a listener
  // that doesn't know a reset is in progress — must not resurrect the data.
  saveSnapshot();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});
