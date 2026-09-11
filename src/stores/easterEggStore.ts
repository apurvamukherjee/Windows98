import { create } from 'zustand';

export const ERROR_CASCADE_CAP = 20;

const ERROR_MESSAGES = [
  'A general protection fault occurred in module NOWHERE.EXE.',
  'This program has performed an illegal but entirely harmless operation.',
  'Fatal exception 0E has occurred at 0000:0000 in nothing at all.',
  'A required file could not be found: IMAGINARY.DLL',
  'The system has detected a problem that does not exist.',
];

function randomMessage(): string {
  return ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)] ?? 'An unknown (and harmless) error occurred.';
}

export interface ErrorDialogEntry {
  id: string;
  x: number;
  y: number;
  message: string;
}

function makeDialog(): ErrorDialogEntry {
  return {
    id: `err-${Math.random().toString(36).slice(2)}`,
    x: 10 + Math.random() * 60,
    y: 10 + Math.random() * 60,
    message: randomMessage(),
  };
}

interface EasterEggStoreState {
  bsodActive: boolean;
  triggerBsod: () => void;
  dismissBsod: () => void;

  errorDialogs: ErrorDialogEntry[];
  errorSpawnedCount: number;
  triggerErrorCascade: () => void;
  closeErrorDialog: (id: string) => void;
}

export const useEasterEggStore = create<EasterEggStoreState>((set) => ({
  bsodActive: false,
  triggerBsod: () => set({ bsodActive: true }),
  dismissBsod: () => set({ bsodActive: false }),

  errorDialogs: [],
  errorSpawnedCount: 0,
  triggerErrorCascade: () => set({ errorDialogs: [makeDialog()], errorSpawnedCount: 1 }),
  closeErrorDialog: (id) =>
    set((state) => {
      const remaining = state.errorDialogs.filter((dialog) => dialog.id !== id);
      const budget = Math.max(0, Math.min(2, ERROR_CASCADE_CAP - state.errorSpawnedCount));
      const spawned = Array.from({ length: budget }, () => makeDialog());
      return {
        errorDialogs: [...remaining, ...spawned],
        errorSpawnedCount: state.errorSpawnedCount + budget,
      };
    }),
}));
