import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { resolveDropTarget } from './dropTarget';
import { useWindowStore } from '../stores/windowStore';
import { useAppInstanceStore } from '../stores/appInstanceStore';
import { DOCUMENTS_ID } from '../stores/fsStore';

beforeEach(() => {
  useWindowStore.setState({ windows: {}, zOrder: [], nextWindowSeq: 0 });
  useAppInstanceStore.setState({ byWindowId: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockElementAt(el: Element | null): void {
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(el);
}

describe('resolveDropTarget', () => {
  test('returns null when nothing is at the point', () => {
    mockElementAt(null);
    expect(resolveDropTarget(0, 0)).toBeNull();
  });

  test('returns desktop when the point is over the desktop background', () => {
    const desktop = document.createElement('div');
    desktop.setAttribute('data-testid', 'desktop');
    document.body.appendChild(desktop);
    mockElementAt(desktop);

    expect(resolveDropTarget(10, 10)).toEqual({ kind: 'desktop' });
  });

  test('returns null when the point is over neither a window nor the desktop', () => {
    mockElementAt(document.createElement('span'));
    expect(resolveDropTarget(10, 10)).toBeNull();
  });

  test('returns explorer with its current folder when over an open Explorer window', () => {
    useWindowStore.setState({
      windows: {
        'win-1': {
          id: 'win-1',
          appId: 'explorer',
          x: 0,
          y: 0,
          w: 400,
          h: 300,
          minimized: false,
          maximized: false,
          snapped: null,
          restoreRect: null,
        },
      },
      zOrder: ['win-1'],
      nextWindowSeq: 1,
    });
    useAppInstanceStore.getState().patchInstanceState('win-1', { currentFolderId: DOCUMENTS_ID });

    const windowEl = document.createElement('div');
    windowEl.setAttribute('data-testid', 'window-win-1');
    const child = document.createElement('div');
    windowEl.appendChild(child);
    document.body.appendChild(windowEl);
    mockElementAt(child);

    expect(resolveDropTarget(10, 10)).toEqual({ kind: 'explorer', folderId: DOCUMENTS_ID });
  });

  test('returns null when the window under the point is not an Explorer', () => {
    useWindowStore.setState({
      windows: {
        'win-1': {
          id: 'win-1',
          appId: 'notepad',
          x: 0,
          y: 0,
          w: 400,
          h: 300,
          minimized: false,
          maximized: false,
          snapped: null,
          restoreRect: null,
        },
      },
      zOrder: ['win-1'],
      nextWindowSeq: 1,
    });

    const windowEl = document.createElement('div');
    windowEl.setAttribute('data-testid', 'window-win-1');
    document.body.appendChild(windowEl);
    mockElementAt(windowEl);

    expect(resolveDropTarget(10, 10)).toBeNull();
  });
});
