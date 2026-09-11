# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

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

### Fixed
- Resize handles no longer intercept clicks meant for the titlebar's minimize/maximize/close buttons (they render underneath the titlebar in paint order).
- Clicking a titlebar button no longer starts a window drag (the click bubbling into the titlebar's own pointerdown handler was hijacking it via `setPointerCapture`).
- A plain click (no movement) on a maximized or snapped window's titlebar no longer restores it — only an actual drag or an explicit double-click does. Previously this could shift focus to the wrong window when attempting a double-click.
- The snap-preview overlay no longer renders above other, non-dragged windows.
