export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function readPixel(buffer: PixelBuffer, x: number, y: number): RGBA {
  const i = (y * buffer.width + x) * 4;
  return { r: buffer.data[i] ?? 0, g: buffer.data[i + 1] ?? 0, b: buffer.data[i + 2] ?? 0, a: buffer.data[i + 3] ?? 0 };
}

function writePixel(buffer: PixelBuffer, x: number, y: number, color: RGBA): void {
  const i = (y * buffer.width + x) * 4;
  buffer.data[i] = color.r;
  buffer.data[i + 1] = color.g;
  buffer.data[i + 2] = color.b;
  buffer.data[i + 3] = color.a;
}

function withinTolerance(a: RGBA, b: RGBA, tolerance: number): boolean {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  );
}

/**
 * Stack-based flood fill, mutating `buffer` in place. A small tolerance
 * (rather than an exact match) matters in practice: anti-aliased stroke
 * edges are never quite one flat color, and without slack the fill would
 * leave a thin unfilled halo around every boundary it touches.
 */
export function floodFill(buffer: PixelBuffer, startX: number, startY: number, fillColor: RGBA, tolerance = 24): void {
  const { width, height } = buffer;
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const target = readPixel(buffer, startX, startY);
  if (withinTolerance(target, fillColor, 0)) return;

  const visited = new Uint8Array(width * height);
  const stack: number[] = [startX, startY];

  while (stack.length > 0) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const flatIndex = y * width + x;
    if (visited[flatIndex] === 1) continue;
    if (!withinTolerance(readPixel(buffer, x, y), target, tolerance)) continue;

    visited[flatIndex] = 1;
    writePixel(buffer, x, y, fillColor);
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
}
