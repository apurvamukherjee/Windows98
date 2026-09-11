# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added — Final wrap-up (M12)
- **Recycle Bin is now a real desktop icon** (it previously only existed inside "This PC" in Explorer — an oversight, not a deliberate cut). It shows a badge when non-empty; right-click (or the Explorer toolbar, while browsing it) offers "Empty Recycle Bin," which permanently deletes its contents and plays a short crumple sound — synthesized on the fly via the Web Audio API, not a downloaded audio asset, same reasoning as the wallpapers.
- **About Windows98.app** (desktop right-click menu): clicking the logo 10 times within a rolling window unlocks a scrolling credits reel.
- **Error-dialog cascade**: a hidden Terminal command (`error`) spawns the classic "Windows error spam" — each closed dialog spawns up to two more, hard-capped at 20 ever spawned so it's a joke, not a freeze.
- **Idle screensaver**: after 90 seconds of no input, a canvas starfield takes over; any input dismisses it; it never triggers under `prefers-reduced-motion`.
- **Any desktop folder icon is now a valid drop target**, not just the Recycle Bin — dropping a file on a folder icon moves it inside that folder, the same resolution used for dropping onto an open Explorer window.
- Refreshed README (feature list + two new screenshots) and a full cross-browser Playwright pass (Chromium/Firefox/WebKit, 39/39) as a pre-launch check.

### Added — Games & easter eggs (M11)
- **Minesweeper**: classic 9×9/10-mine board, first-click-never-a-mine, flood-fill reveal, flagging, mine counter, timer, win/lose states.
- **Solitaire (Klondike)**: full ruleset (foundation/tableau stacking, valid multi-card run moves, stock draw/recycle, double-click-to-foundation), dragging built on the same `usePointerDrag` primitive as windows and desktop icons — proving the drag engine generalizes to a very different shape (cards, not chrome).
- A working taskbar clock, double-click for a "Date/Time Properties" dialog — a real Windows 98 behavior, not a joke.
- A `credits.txt` seeded into Documents from first boot.
- Terminal joke commands: `whoami`, `sudo make me a sandwich`, `sl` (ASCII train), `matrix` (falling-character overlay inside the terminal), and a hidden `bsod` command.
- A secret Konami code (↑↑↓↓←→←→BA) makes the desktop briefly wobble.
- A fake crash screen (triggered by the Terminal's `bsod` command) that "reboots" back to the desktop by reusing the existing boot screen component.
- Four additional selectable wallpapers (Clouds, Rivets, Bubbles, Squares) — original CSS gradient/pattern designs evoking the period style, alongside the existing solid-color presets.

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
- **No real Windows 98 wallpaper bitmaps, ever.** The classic shipped wallpapers (Clouds, Rivets, Bubbles, the tiled pattern, etc.) are Microsoft's copyrighted artwork, not something to bundle into a public repo. Every wallpaper option — including the new M11 additions — is an original CSS gradient/pattern evoking the period style, never a reproduction of a shipped asset. Same principle applied to the BSOD easter egg: its copy is an original parody, not a verbatim reproduction of Microsoft's actual error text.
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
- **Dropping a file onto the Recycle Bin (or any other desktop folder icon) never actually moved it** (M12): `resolveDropTarget` only ever recognized "an open Explorer window" or "bare desktop" — dropping onto another desktop icon fell through to the bare-desktop case and just repositioned the file next to it. No unit test caught it, since jsdom doesn't do real hit-testing. Fixed by resolving the icon under the cursor and checking whether it's a folder.
- **...which surfaced a second bug once the first was fixed**: dragging one desktop icon onto another consistently resolved to the *dragged* icon itself, not whatever was underneath it. Same-z-order desktop icons stack by DOM order, and the dragged icon — which follows the cursor — was almost always the topmost thing at that point. Fixed by setting `pointer-events: none` on the dragged icon(s) for the duration of the gesture, so hit-testing sees through to the real target underneath.
- **...and a third, caught by the existing persistence E2E spec failing on all three browsers**: pointer-events were restored *before* resolving the drop target, undoing the fix above at the exact moment it mattered — and because the dragged icon usually is itself a folder, a plain reposition-on-the-desktop drag was being misread as "drop into itself," which the move-cycle guard silently no-ops. The new position never reached `setIconPosition`, so it reverted to its default grid slot on reload. Fixed by resolving the drop target first and restoring pointer-events only afterward.
- **Clicking anything inside the About dialog silently did nothing** — not just the credits-reel logo, no click inside the dialog registered at all, with no console error. Root cause: the dialog is rendered inside Desktop's own tree, whose background `pointerdown` handler (for rubber-band select) calls `setPointerCapture` on the desktop element itself; left unstopped, that retargets the browser's click synthesis away from anything inside the dialog. `ContextMenu` already had the identical fix for the identical reason (`stopPropagation` on `pointerdown`) — the About dialog was just missing it. Found via real-browser testing: `fireEvent.click` in jsdom never exercises pointer capture, so the unit tests passed the whole time.
