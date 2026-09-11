import { create } from 'zustand';

interface TaskbarStoreState {
  pinnedAppIds: string[];
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
}

export const useTaskbarStore = create<TaskbarStoreState>((set) => ({
  pinnedAppIds: [],

  pinApp: (appId) =>
    set((state) => (state.pinnedAppIds.includes(appId) ? state : { pinnedAppIds: [...state.pinnedAppIds, appId] })),

  unpinApp: (appId) =>
    set((state) =>
      state.pinnedAppIds.includes(appId) ? { pinnedAppIds: state.pinnedAppIds.filter((id) => id !== appId) } : state,
    ),
}));
