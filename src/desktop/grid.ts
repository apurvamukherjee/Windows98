export const ICON_CELL_W = 80;
export const ICON_CELL_H = 90;

export function snapToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.round(x / ICON_CELL_W) * ICON_CELL_W),
    y: Math.max(0, Math.round(y / ICON_CELL_H) * ICON_CELL_H),
  };
}

/**
 * Assigns a free grid cell to every id in `ids` that has no entry in
 * `positioned`, without colliding with `positioned` or with each other.
 * Deterministic for a given input, so unrelated icons never jump around —
 * only ids actually missing a stored position get placed.
 */
export function assignDefaultPositions(
  ids: string[],
  positioned: Record<string, { x: number; y: number }>,
): Record<string, { x: number; y: number }> {
  const taken = new Set(
    Object.values(positioned).map(({ x, y }) => `${x / ICON_CELL_W},${y / ICON_CELL_H}`),
  );
  const result: Record<string, { x: number; y: number }> = {};

  for (const id of ids) {
    if (positioned[id] !== undefined) continue;
    let col = 0;
    let row = 0;
    while (taken.has(`${col},${row}`)) {
      row += 1;
      if (row > 200) {
        row = 0;
        col += 1;
      }
    }
    taken.add(`${col},${row}`);
    result[id] = { x: col * ICON_CELL_W, y: row * ICON_CELL_H };
  }

  return result;
}
