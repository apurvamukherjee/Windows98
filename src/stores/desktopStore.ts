import { create } from 'zustand';

export const DEFAULT_WALLPAPER = '#008080';

interface DesktopStoreState {
  iconPositions: Record<string, { x: number; y: number }>;
  wallpaper: string;
  setIconPosition: (id: string, x: number, y: number) => void;
  setWallpaper: (color: string) => void;
}

export const useDesktopStore = create<DesktopStoreState>((set) => ({
  iconPositions: {},
  wallpaper: DEFAULT_WALLPAPER,

  setIconPosition: (id, x, y) =>
    set((state) => ({
      iconPositions: { ...state.iconPositions, [id]: { x, y } },
    })),

  setWallpaper: (color) => set({ wallpaper: color }),
}));
