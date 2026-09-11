import { create } from 'zustand';

interface EasterEggStoreState {
  bsodActive: boolean;
  triggerBsod: () => void;
  dismissBsod: () => void;
}

export const useEasterEggStore = create<EasterEggStoreState>((set) => ({
  bsodActive: false,
  triggerBsod: () => set({ bsodActive: true }),
  dismissBsod: () => set({ bsodActive: false }),
}));
