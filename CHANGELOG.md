# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added — Paint (M8)
- Full Paint app: pencil, eraser, line, rectangle, and a real stack-based flood fill, over a raw Canvas 2D API (no canvas library).
- Canvas backing store sized to `devicePixelRatio` deliberately, so drawings are crisp on retina displays rather than blurry by accident.
- Save/Open wired to the same file system as every other app — a drawing saved in Paint is a real image `FileNode`, browsable in Explorer and reopenable exactly as drawn.

### Added — Terminal (M9)
- A real shell (`ls, cd, cat, mkdir, touch, rm, echo, open, clear, help`) against the *same* `useFSStore` every other app uses — delete a file from the Terminal and it vanishes live from an already-open Explorer window, no refresh.
- Real path resolution: absolute (`/Documents`), relative, `.`/`..`, multi-segment.
- `open` on a file launches it in whichever app claims that type; `open` on a folder launches a real scoped Explorer window — the same shared helpers Explorer and the Desktop use.
- Command history (Arrow Up/Down) and scrollback, the latter persisted per window instance so it survives minimize/restore.

### Added — Final polish (M10)
- Lightweight window switcher: Ctrl+Tab / Cmd+Tab cycles focus through open windows (Shift reverses direction) — real Alt+Tab is an OS-level shortcut a page can never intercept, so this is the closest binding that actually works.
- Minimize now animates (shrink + fade toward the taskbar) instead of vanishing instantly; maximize/restore/snap-settle animate via a CSS transition that's explicitly suspended during an active drag/resize so it never fights the ref-driven gesture. Everything respects `prefers-reduced-motion`.
- Windows are `role="dialog"` with an `aria-label` from the app title, and receive focus on open/restore.
- A wallpaper picker (right-click the desktop) — solid colors only; see Decisions.
- Taskbar pinning: pin any running app (right-click its taskbar button) to keep a launcher there after it closes.
- A boot screen on load (skippable by click or keypress), respecting `prefers-reduced-motion`.
- A real, committed Playwright suite — `drag-resize.spec.ts`, `snap.spec.ts`, `dnd-explorer-desktop.spec.ts` — run across Chromium, Firefox, and WebKit in addition to the persistence suite.

### Added — Persistence (M7)
- Combined `localStorage` envelope covering the file system, windows, desktop icon positions, and per-window app state — one atomic snapshot rather than four independently-drifting keys.
- Debounced writes (~500ms, trailing) plus a synchronous flush on `visibilitychange`/`beforeunload`, so closing the tab right after typing doesn't lose the last few keystrokes.
- Corrupt JSON, a schema-version mismatch, or a missing section all fall back to a fresh reseed rather than a crash or a half-applied migration.
- "Reset Desktop" in the Start Menu as an escape hatch back to defaults.
- A real Playwright suite (`tests-e2e/persistence-reload.spec.ts`) that reloads the actual page and asserts state survived — run across Chromium, Firefox, and WebKit.

### Added — Desktop icons & drag-and-drop (M6)
- Real desktop icons: any file/folder placed in the Desktop folder renders as an icon, grid-snapped, with default positions auto-assigned so nothing overlaps.
- Rubber-band multi-select and drag-together: select several icons, drag any one of them, and the whole selection moves as a group, using the exact same pointer-drag primitive as window dragging.
- Cross-window drag: drag a desktop icon onto an open Explorer window (or a file out of Explorer onto the desktop) to move it there — resolved by checking what's under the cursor at drop time, not native HTML5 drag-and-drop (see Decisions below).
- A generic right-click `ContextMenu` component, wired to the desktop background (New Folder) and to icons (Open/Rename/Delete).

### Added — File Explorer (M5)
- Full My Computer / File Explorer app: folder tree sidebar, icon and list views, breadcrumb navigation, Up/New Folder/Rename/Delete.
- File-type routing (`resolveAppForFileType`): double-clicking a file opens it in whichever registered app claims that type.
- Auto-suffixing on folder name collisions ("New Folder" → "New Folder (1)").

### Added — Virtual file system (M4)
- In-memory file system (`useFSStore`) seeded with This PC / Desktop / Documents / Recycle Bin folders.
- Per-window app state (`useAppInstanceStore`), keyed by window id, so an app's state survives minimize/restore even though its component unmounts.
- Notepad: real Open/Save wired to the file system, with a minimal in-app file list dialog. Content is scoped per window instance, not shared globally.

### Added — App registry & Start Menu (M3)
- `APP_REGISTRY`: single source of truth for every installed app (title, icon, default size, component).
- `openWindow` action generates a unique id per launch, so the same app can be opened multiple times as independent instances.
- Start Menu in the taskbar, listing every registered app; closes on launch or on an outside click.
- Notepad: first real app, a plain text editor.

### Added — Multi-window chrome (M2)
- Minimize, maximize, and restore, including popping a maximized/snapped window back to its floating size when you start dragging it.
- Focus and z-order stacking: clicking any part of a window brings it to front.
- Aero-Snap-style edge snapping (left half / right half / top-to-maximize) with a live ghost preview, driven by the same zero-re-render technique as window dragging.
- Taskbar with per-window buttons (minimize/restore/focus dispatch) and an active-window indicator.
- Small-screen fork: below ~768px, windows force-maximize and dragging/resizing disables.

### Added — Core window engine (M1)
- Pointer-capture + `requestAnimationFrame` drag primitive (`usePointerDrag`), reused by every draggable surface in the app.
- Eight-handle resize with correct opposite-edge pinning at the minimum size.
- Selector-scoped Zustand window store: dragging or resizing one window causes zero re-renders of any other window, verified by an automated `Profiler`-based test.

### Added — Project scaffold (M0)
- Vite + React 19 + TypeScript (strict) + Vitest + Playwright, ESLint/Prettier.

### Decisions
- **No native HTML5 drag-and-drop.** Desktop icons need pointer-based dragging for same-surface repositioning and multi-select — mixing that with native `draggable`/`dragstart` on the same element is a known source of browser-dependent conflicts. Every drag in the app, including cross-window file moves, goes through the same `usePointerDrag` primitive; the drop target is resolved via `document.elementFromPoint()` at release time instead.

### Fixed
- Resize handles no longer intercept clicks meant for the titlebar's minimize/maximize/close buttons (they render underneath the titlebar in paint order).
- Clicking a titlebar button no longer starts a window drag (the click bubbling into the titlebar's own pointerdown handler was hijacking it via `setPointerCapture`).
- A plain click (no movement) on a maximized or snapped window's titlebar no longer restores it — only an actual drag or an explicit double-click does. Previously this could shift focus to the wrong window when attempting a double-click.
- The snap-preview overlay no longer renders above other, non-dragged windows.
- Explorer's rename input now selects the existing name on focus, instead of placing the cursor at the end — typing immediately after clicking Rename used to append to the old name rather than replace it.
- "Reset Desktop" no longer silently fails to reset: the page's own `beforeunload` flush listener was re-saving the about-to-be-cleared state during the reload it triggers, undoing the reset before the fresh page finished loading.
- **Resizing was silently broken in every real browser** (M10): the same paint-order fix that made resize handles render underneath the titlebar also let window *content* paint on top of the handles at the corners, swallowing every resize pointerdown. No unit test caught it because jsdom doesn't do real hit-testing — only writing the first real Playwright resize spec surfaced it. Fixed with an explicit z-index scheme inside each window (content < handles < titlebar) instead of relying on DOM order.
- The Alt+Tab-style window cycler originally just toggled between the top two windows on repeated presses instead of rotating through all of them — caught by a unit test that asserted a full N-press cycle returns to the start.
- Fixed a genuine cross-browser quirk in the E2E suite itself: Playwright's `steps`-based synthetic mouse drag fires pointermove events too tightly for headless WebKit to process queued `requestAnimationFrame` callbacks before release, so drags silently no-opped in WebKit test runs specifically (never a real-user issue — real Safari input is naturally paced to frame timing). Fixed with a short settle wait before every `mouse.up()` in the E2E suite.
