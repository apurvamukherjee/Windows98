export const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

export function matchesKonamiCode(buffer: readonly string[]): boolean {
  if (buffer.length < KONAMI_SEQUENCE.length) return false;
  const tail = buffer.slice(buffer.length - KONAMI_SEQUENCE.length);
  return tail.every((key, index) => key.toLowerCase() === KONAMI_SEQUENCE[index]?.toLowerCase());
}
