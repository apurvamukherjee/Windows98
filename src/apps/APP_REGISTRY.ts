import { Notepad } from './notepad/Notepad';
import { Explorer } from './explorer/Explorer';
import { Paint } from './paint/Paint';
import { Terminal } from './terminal/Terminal';
import { Minesweeper } from './minesweeper/Minesweeper';
import { Solitaire } from './solitaire/Solitaire';
import type { FileType } from '../fs/fsTypes';

export interface AppComponentProps {
  windowId: string;
}

export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  component: React.FC<AppComponentProps>;
  defaultSize: { w: number; h: number };
  /** File types this app can open via double-click/Open dialogs. Omit for apps that aren't file viewers. */
  supportedFileTypes?: readonly FileType[];
}

export const APP_REGISTRY: Record<string, AppDefinition> = {
  notepad: {
    id: 'notepad',
    title: 'Notepad',
    icon: '📝',
    component: Notepad,
    defaultSize: { w: 380, h: 260 },
    supportedFileTypes: ['text'],
  },
  explorer: {
    id: 'explorer',
    title: 'My Computer',
    icon: '🖥️',
    component: Explorer,
    defaultSize: { w: 480, h: 340 },
  },
  paint: {
    id: 'paint',
    title: 'Paint',
    icon: '🎨',
    component: Paint,
    defaultSize: { w: 420, h: 340 },
    supportedFileTypes: ['image'],
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    icon: '💻',
    component: Terminal,
    defaultSize: { w: 480, h: 320 },
  },
  minesweeper: {
    id: 'minesweeper',
    title: 'Minesweeper',
    icon: '💣',
    component: Minesweeper,
    defaultSize: { w: 250, h: 320 },
  },
  solitaire: {
    id: 'solitaire',
    title: 'Solitaire',
    icon: '🃏',
    component: Solitaire,
    defaultSize: { w: 420, h: 460 },
  },
};

export function resolveAppForFileType(fileType: FileType): AppDefinition | undefined {
  return Object.values(APP_REGISTRY).find((app) => app.supportedFileTypes?.includes(fileType) === true);
}
