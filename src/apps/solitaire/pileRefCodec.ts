import type { PileRef } from './solitaireLogic';

export function encodePileRef(ref: PileRef): string {
  if (ref.type === 'tableau' || ref.type === 'foundation') return `${ref.type}-${ref.index}`;
  return ref.type;
}

export function decodePileRef(encoded: string): PileRef | null {
  if (encoded === 'waste') return { type: 'waste' };
  if (encoded === 'stock') return { type: 'stock' };
  const tableauMatch = /^tableau-(\d+)$/.exec(encoded);
  if (tableauMatch?.[1] !== undefined) return { type: 'tableau', index: Number(tableauMatch[1]) };
  const foundationMatch = /^foundation-(\d+)$/.exec(encoded);
  if (foundationMatch?.[1] !== undefined) return { type: 'foundation', index: Number(foundationMatch[1]) };
  return null;
}

/** Resolves which pile is under a point at drag-end, the same technique the desktop uses for cross-window drops. */
export function resolveSolitaireDropTarget(clientX: number, clientY: number): PileRef | null {
  const el = document.elementFromPoint(clientX, clientY);
  const encoded = el?.closest('[data-pile]')?.getAttribute('data-pile');
  return encoded === null || encoded === undefined ? null : decodePileRef(encoded);
}
