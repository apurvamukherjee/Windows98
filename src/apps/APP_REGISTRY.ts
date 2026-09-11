import { Notepad } from './notepad/Notepad';

export interface AppComponentProps {
  windowId: string;
}

export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  component: React.FC<AppComponentProps>;
  defaultSize: { w: number; h: number };
}

export const APP_REGISTRY: Record<string, AppDefinition> = {
  notepad: {
    id: 'notepad',
    title: 'Notepad',
    icon: '📝',
    component: Notepad,
    defaultSize: { w: 380, h: 260 },
  },
};
