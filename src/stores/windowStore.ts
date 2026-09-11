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
}

interface WindowStoreState {
  windows: Record<string, WindowState>;
  zOrder: string[];
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, rect: Rect) => void;
}

export const useWindowStore = create<WindowStoreState>((set) => ({
  windows: {},
  zOrder: [],
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
}));
