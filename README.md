# Windows98.app

A real desktop operating system, simulated entirely in the browser — not a nostalgia skin, an actual window manager. Open apps, drag and resize real windows, snap them to the screen edges, minimize and maximize, and switch between them from a taskbar. Every interaction is built from scratch: no window-manager library, no drag-and-drop library, no UI kit.

![Desktop with two windows, one snapped to the right half of the screen](docs/screenshots/desktop.png)

## What makes this different from a CSS mockup

Most "recreate an old OS" projects fake the parts that are actually hard. This one doesn't:

- **Dragging is compositor-only.** Windows move via `transform: translate3d()` mutated directly on the DOM node inside a single `requestAnimationFrame` callback per frame — never through React state. Dragging one window causes **zero re-renders of every other window on screen**, verified by an automated test that asserts render counts via React's `Profiler` API, not just eyeballed.
- **Resizing is edge-and-corner accurate.** All eight resize handles (corners and edges) are real, each independently clamped to a minimum size while pinning the correct opposite edge in place — exactly like a real OS, not just a single bottom-right grip.
- **Snapping has a real ghost preview.** Drag a window to a screen edge and a translucent preview shows where it'll land before you release — driven by the same zero-re-render technique as dragging itself.
- **Every window subscribes to only its own state.** The store is sliced per-window (via Zustand selectors), so moving, resizing, minimizing, or maximizing one window never touches the render of any other window, no matter how many are open.
- **A real virtual file system.** Documents live in an in-memory file system shared across every app — save a file in Notepad, and it's genuinely persisted as data, not just component state.

## Features

- Draggable, resizable windows with authentic Windows 98 chrome
- Focus and z-order stacking that behaves the way a real window manager does
- Minimize, maximize, and restore — including popping a maximized window back to its original size mid-drag
- Aero-Snap-style edge snapping with a live preview
- A taskbar that tracks every open window and a Start Menu for launching apps
- Multiple independent instances of the same app at once
- A virtual file system: Notepad's Open/Save dialogs read and write real files
- Small-screen mode: below tablet width, windows behave like a mobile app switcher instead of fighting for space

## In progress

More built-in apps (Paint, File Explorer, Terminal), drag-and-drop between windows and the desktop, local persistence so your desktop survives a reload, and a couple of classic games.

## Tech stack

| | |
|---|---|
| **Framework** | React 19 + TypeScript (strict) |
| **Bundler** | Vite |
| **State** | Zustand — chosen specifically for selector-scoped subscriptions, the foundation of the zero-re-render drag model |
| **Testing** | Vitest + React Testing Library for unit/component behavior, Playwright for real pointer-drag and cross-browser interaction |
| **Styling** | Hand-authored CSS Modules — no UI framework, since faithfully reproducing Windows 98's exact bevels and metrics isn't something a modern component kit can do |

No drag-and-drop library, no animation library, no icon library. Every one of those is either free from the browser (native pointer events, CSS transitions) or small enough to author by hand — and hand-authoring it is the point of the project.

## Screenshots

![Start Menu open above the taskbar](docs/screenshots/start-menu.png)

## Running it locally

```bash
npm install
npm run dev       # start the dev server
npm run test      # unit + component tests
npm run typecheck
npm run lint
npm run build     # production build
```

## Architecture, briefly

- `stores/` — Zustand stores: window geometry/z-order, the virtual file system, per-window app state, all deliberately separate so a change in one never triggers a re-render tied to another.
- `hooks/usePointerDrag.ts` — the single primitive every drag interaction in the app is built on: pointer capture, `requestAnimationFrame` batching, and cleanup on `pointercancel`/`blur` so a gesture can never get stuck.
- `window-manager/` — window chrome, resize math, and the snap-zone/ghost-preview logic.
- `apps/` — self-contained app components, each registered once and completely unaware of window mechanics.
- `taskbar/` — taskbar and Start Menu, derived entirely from the window store with no logic of its own.
