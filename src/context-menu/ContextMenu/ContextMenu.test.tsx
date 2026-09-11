import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ContextMenu } from './ContextMenu';

describe('ContextMenu', () => {
  test('renders each item and invokes onSelect then onClose when clicked', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ContextMenu x={10} y={20} items={[{ label: 'New Folder', onSelect }]} onClose={onClose} />);

    fireEvent.click(screen.getByRole('menuitem', { name: 'New Folder' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not invoke onSelect for a disabled item', () => {
    const onSelect = vi.fn();
    render(<ContextMenu x={0} y={0} items={[{ label: 'Delete', onSelect, disabled: true }]} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('closes on outside pointerdown', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[{ label: 'X', onSelect: vi.fn() }]} onClose={onClose} />);

    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[{ label: 'X', onSelect: vi.fn() }]} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('a pointerdown inside the menu does not close it', () => {
    const onClose = vi.fn();
    render(<ContextMenu x={0} y={0} items={[{ label: 'X', onSelect: vi.fn() }]} onClose={onClose} />);

    fireEvent.pointerDown(screen.getByRole('menu'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
