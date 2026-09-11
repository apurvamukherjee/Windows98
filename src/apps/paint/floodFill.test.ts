import { describe, expect, test } from 'vitest';
import { floodFill, type PixelBuffer, type RGBA } from './floodFill';

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 255 };
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 255 };
const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

function makeBuffer(width: number, height: number, fill: RGBA): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill.r;
    data[i + 1] = fill.g;
    data[i + 2] = fill.b;
    data[i + 3] = fill.a;
  }
  return { data, width, height };
}

function pixelAt(buffer: PixelBuffer, x: number, y: number): RGBA {
  const i = (y * buffer.width + x) * 4;
  return { r: buffer.data[i] ?? 0, g: buffer.data[i + 1] ?? 0, b: buffer.data[i + 2] ?? 0, a: buffer.data[i + 3] ?? 0 };
}

describe('floodFill', () => {
  test('fills an entire uniform buffer', () => {
    const buffer = makeBuffer(10, 10, WHITE);
    floodFill(buffer, 5, 5, RED);
    expect(pixelAt(buffer, 0, 0)).toEqual(RED);
    expect(pixelAt(buffer, 9, 9)).toEqual(RED);
  });

  test('does not cross a solid boundary', () => {
    const buffer = makeBuffer(10, 10, WHITE);
    // A vertical black wall down the middle column.
    for (let y = 0; y < 10; y++) {
      const i = (y * 10 + 5) * 4;
      buffer.data[i] = BLACK.r;
      buffer.data[i + 1] = BLACK.g;
      buffer.data[i + 2] = BLACK.b;
      buffer.data[i + 3] = BLACK.a;
    }

    floodFill(buffer, 0, 0, RED);

    expect(pixelAt(buffer, 2, 2)).toEqual(RED);
    expect(pixelAt(buffer, 8, 8)).toEqual(WHITE); // other side of the wall, untouched
    expect(pixelAt(buffer, 5, 5)).toEqual(BLACK); // the wall itself, untouched
  });

  test('is a no-op when the start pixel is already the fill color', () => {
    const buffer = makeBuffer(4, 4, RED);
    const before = new Uint8ClampedArray(buffer.data);
    floodFill(buffer, 0, 0, RED);
    expect(buffer.data).toEqual(before);
  });

  test('tolerance absorbs near-matching (anti-aliased) pixels into the fill', () => {
    const buffer = makeBuffer(4, 4, WHITE);
    // A near-white pixel, as an anti-aliased stroke edge might leave behind.
    const i = (1 * 4 + 1) * 4;
    buffer.data[i] = 245;
    buffer.data[i + 1] = 245;
    buffer.data[i + 2] = 245;
    buffer.data[i + 3] = 255;

    floodFill(buffer, 0, 0, RED, 24);

    expect(pixelAt(buffer, 1, 1)).toEqual(RED);
  });

  test('ignores an out-of-bounds start point', () => {
    const buffer = makeBuffer(4, 4, WHITE);
    const before = new Uint8ClampedArray(buffer.data);
    floodFill(buffer, -1, 0, RED);
    expect(buffer.data).toEqual(before);
  });
});
