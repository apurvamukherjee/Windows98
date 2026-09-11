import { useFSStore } from '../stores/fsStore';
import { useWindowStore } from '../stores/windowStore';
import { useDesktopStore } from '../stores/desktopStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import type { FSNode } from '../fs/fsTypes';
import type { WindowState } from '../stores/windowStore';

export const STORAGE_KEY = 'win98:v1:state';
export const SCHEMA_VERSION = 1;

interface PersistedEnvelope {
  schemaVersion: number;
  fs: { nodes: Record<string, FSNode>; nextNodeSeq: number };
  windows: { windows: Record<string, WindowState>; zOrder: string[]; nextWindowSeq: number };
  desktop: { iconPositions: Record<string, { x: number; y: number }> };
  appInstances: { byWindowId: Record<string, Record<string, unknown>> };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deliberately shallow: enough to not crash on garbage/corrupt storage, not
 * a full schema validator. On any mismatch we reseed from defaults rather
 * than attempt a migration — see the plan's persistence section for why.
 */
function isValidEnvelope(value: unknown): value is PersistedEnvelope {
  if (!isPlainObject(value)) return false;
  if (value.schemaVersion !== SCHEMA_VERSION) return false;
  return isPlainObject(value.fs) && isPlainObject(value.windows) && isPlainObject(value.desktop) && isPlainObject(value.appInstances);
}

function buildSnapshot(): PersistedEnvelope {
  const fs = useFSStore.getState();
  const windows = useWindowStore.getState();
  const desktop = useDesktopStore.getState();
  const appInstances = useAppInstanceStore.getState();
  return {
    schemaVersion: SCHEMA_VERSION,
    fs: { nodes: fs.nodes, nextNodeSeq: fs.nextNodeSeq },
    windows: { windows: windows.windows, zOrder: windows.zOrder, nextWindowSeq: windows.nextWindowSeq },
    desktop: { iconPositions: desktop.iconPositions },
    appInstances: { byWindowId: appInstances.byWindowId },
  };
}

// Set by resetPersistedState() just before reload. Without this, the
// beforeunload flush listener (still attached, since it has no reason to
// know a reset is underway) would re-save the about-to-be-discarded state
// right back into storage during that same reload, undoing the reset.
let resetInProgress = false;

export function saveSnapshot(): void {
  if (resetInProgress) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot()));
  } catch (error) {
    // Safari private browsing throws on setItem; a full quota is also
    // realistic once Paint images start landing in the FS. Either way, the
    // session just stops persisting rather than crashing.
    console.warn('Windows98.app: failed to save state', error);
  }
}

/** Returns true if a valid saved envelope was found and applied. */
export function loadPersistedState(): boolean {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Windows98.app: failed to read saved state', error);
    return false;
  }
  if (raw === null) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('Windows98.app: saved state was corrupt JSON, reseeding', error);
    return false;
  }

  if (!isValidEnvelope(parsed)) {
    console.warn('Windows98.app: saved state failed validation (schema mismatch?), reseeding');
    return false;
  }

  useFSStore.setState(parsed.fs);
  useWindowStore.setState(parsed.windows);
  useDesktopStore.setState(parsed.desktop);
  useAppInstanceStore.setState(parsed.appInstances);
  return true;
}

const DEBOUNCE_MS = 500;

/**
 * Loads any saved state, then keeps it in sync: every store change schedules
 * a debounced save, and a synchronous flush on visibilitychange/beforeunload
 * catches the case where the tab closes inside that debounce window.
 * Returns whether a save was actually restored, and a cleanup function.
 */
export function initPersistence(): { restored: boolean; cleanup: () => void } {
  const restored = loadPersistedState();

  let timer: ReturnType<typeof setTimeout> | null = null;
  const scheduleSave = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(saveSnapshot, DEBOUNCE_MS);
  };

  const unsubscribes = [
    useFSStore.subscribe(scheduleSave),
    useWindowStore.subscribe(scheduleSave),
    useDesktopStore.subscribe(scheduleSave),
    useAppInstanceStore.subscribe(scheduleSave),
  ];

  const flush = (): void => {
    if (timer !== null) clearTimeout(timer);
    saveSnapshot();
  };
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') flush();
  };
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', onVisibilityChange);

  const cleanup = (): void => {
    if (timer !== null) clearTimeout(timer);
    for (const unsubscribe of unsubscribes) unsubscribe();
    window.removeEventListener('beforeunload', flush);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };

  return { restored, cleanup };
}

/** The Start Menu's "Reset Desktop" escape hatch. */
export function resetPersistedState(): void {
  resetInProgress = true;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Windows98.app: failed to clear saved state', error);
  }
  window.location.reload();
}
