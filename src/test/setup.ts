import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia implementation. Default every test to "not a
// small screen" unless it stubs its own — usePointerDrag/Window tests don't
// care about the breakpoint, only useMediaQuery.test.ts does.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom does no layout at all, so it has no elementFromPoint either. Default
// to "nothing there"; tests that care about drop-target resolution stub
// their own return value with vi.spyOn (which requires the property to
// already exist — hence defining it here rather than leaving it undefined).
if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
}
