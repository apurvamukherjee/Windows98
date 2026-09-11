import { create } from 'zustand';

interface DesktopStoreState {
  iconPositions: Record<string, { x: number; y: number }>;
  setIconPosition: (id: string, x: number, y: number) => void;
}

export const useDesktopStore = create<DesktopStoreState>((set) => ({
  iconPositions: {},

  setIconPosition: (id, x, y) =>
    set((state) => ({
      iconPositions: { ...state.iconPositions, [id]: { x, y } },
    })),
}));
