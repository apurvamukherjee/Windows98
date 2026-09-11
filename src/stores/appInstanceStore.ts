import { create } from 'zustand';

interface AppInstanceStoreState {
  byWindowId: Record<string, Record<string, unknown>>;
  patchInstanceState: (windowId: string, patch: Record<string, unknown>) => void;
  clearInstanceState: (windowId: string) => void;
}

export const useAppInstanceStore = create<AppInstanceStoreState>((set) => ({
  byWindowId: {},

  patchInstanceState: (windowId, patch) =>
    set((state) => ({
      byWindowId: { ...state.byWindowId, [windowId]: { ...state.byWindowId[windowId], ...patch } },
    })),

  clearInstanceState: (windowId) =>
    set((state) => {
      if (!(windowId in state.byWindowId)) return state;
      const rest = { ...state.byWindowId };
      delete rest[windowId];
      return { byWindowId: rest };
    }),
}));
