import { Notepad } from './notepad/Notepad';
import { Explorer } from './explorer/Explorer';
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
};

export function resolveAppForFileType(fileType: FileType): AppDefinition | undefined {
  return Object.values(APP_REGISTRY).find((app) => app.supportedFileTypes?.includes(fileType) === true);
}
