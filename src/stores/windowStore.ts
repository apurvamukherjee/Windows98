import { create } from 'zustand';

export type SnapZone = 'left' | 'right' | 'top' | null;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowState extends Rect {
  id: string;
  appId: string;
  minimized: boolean;
  maximized: boolean;
  snapped: SnapZone;
  /** Floating rect to return to when un-maximizing or un-snapping. */
  restoreRect: Rect | null;
}

interface WindowStoreState {
  windows: Record<string, WindowState>;
  zOrder: string[];
  nextWindowSeq: number;
  openWindow: (appId: string, size: { w: number; h: number }) => string;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, rect: Rect) => void;
  focus: (id: string) => void;
  cycleFocus: (direction: 1 | -1) => void;
  minimize: (id: string) => void;
  restoreFromMinimized: (id: string) => void;
  maximizeWindow: (id: string, rect: Rect) => void;
  restoreWindow: (id: string) => void;
  snapWindow: (id: string, zone: Exclude<SnapZone, null>, rect: Rect) => void;
  closeWindow: (id: string) => void;
}

export const useWindowStore = create<WindowStoreState>((set, get) => ({
  windows: {},
  zOrder: [],
  nextWindowSeq: 0,

  openWindow: (appId, size) => {
    const seq = get().nextWindowSeq;
    const id = `win-${seq}`;
    const cascade = (get().zOrder.length % 8) * 24;
    const newWindow: WindowState = {
      id,
      appId,
      x: 60 + cascade,
      y: 60 + cascade,
      w: size.w,
      h: size.h,
      minimized: false,
      maximized: false,
      snapped: null,
      restoreRect: null,
    };
    set((state) => ({
      windows: { ...state.windows, [id]: newWindow },
      zOrder: [...state.zOrder, id],
      nextWindowSeq: seq + 1,
    }));
    return id;
  },

  moveWindow: (id, x, y) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined) return state;
      return { windows: { ...state.windows, [id]: { ...win, x, y } } };
    }),

  resizeWindow: (id, rect) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined) return state;
      return { windows: { ...state.windows, [id]: { ...win, ...rect } } };
    }),

  focus: (id) =>
    set((state) => {
      if (!(id in state.windows) || state.zOrder.at(-1) === id) return state;
      return { zOrder: [...state.zOrder.filter((w) => w !== id), id] };
    }),

  cycleFocus: (direction) =>
    set((state) => {
      const visible = state.zOrder.filter((id) => state.windows[id]?.minimized === false);
      if (visible.length <= 1) return state;
      // A true rotation, not a top<->second swap: each press should bring a
      // *different* window forward than the last, visiting every window
      // exactly once before returning to the start after N presses.
      const top = visible[visible.length - 1] as string;
      const rotated = direction === -1 ? [top, ...visible.slice(0, -1)] : [...visible.slice(1), visible[0] as string];
      const rotatedSet = new Set(rotated);
      const others = state.zOrder.filter((id) => !rotatedSet.has(id));
      return { zOrder: [...others, ...rotated] };
    }),

  minimize: (id) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined || win.minimized) return state;
      return { windows: { ...state.windows, [id]: { ...win, minimized: true } } };
    }),

  restoreFromMinimized: (id) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined || !win.minimized) return state;
      return { windows: { ...state.windows, [id]: { ...win, minimized: false } } };
    }),

  maximizeWindow: (id, rect) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined || win.maximized) return state;
      const restoreRect = win.snapped === null ? { x: win.x, y: win.y, w: win.w, h: win.h } : win.restoreRect;
      return {
        windows: {
          ...state.windows,
          [id]: { ...win, ...rect, maximized: true, snapped: null, restoreRect },
        },
      };
    }),

  restoreWindow: (id) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined || (!win.maximized && win.snapped === null)) return state;
      const back = win.restoreRect ?? { x: win.x, y: win.y, w: win.w, h: win.h };
      return {
        windows: {
          ...state.windows,
          [id]: { ...win, ...back, maximized: false, snapped: null, restoreRect: null },
        },
      };
    }),

  snapWindow: (id, zone, rect) =>
    set((state) => {
      const win = state.windows[id];
      if (win === undefined) return state;
      const restoreRect =
        win.snapped === null && !win.maximized ? { x: win.x, y: win.y, w: win.w, h: win.h } : win.restoreRect;
      return {
        windows: {
          ...state.windows,
          [id]: { ...win, ...rect, snapped: zone, maximized: false, restoreRect },
        },
      };
    }),

  closeWindow: (id) =>
    set((state) => {
      if (!(id in state.windows)) return state;
      const rest = { ...state.windows };
      delete rest[id];
      return { windows: rest, zOrder: state.zOrder.filter((w) => w !== id) };
    }),
}));
