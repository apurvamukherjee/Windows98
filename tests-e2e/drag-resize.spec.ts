import { test, expect } from '@playwright/test';

// A short settle wait before every mouse.up() below: Playwright's
// steps-based mouse simulation fires pointermove events in too tight a
// sequence for headless WebKit to process queued requestAnimationFrame
// callbacks before release, even though real Safari input — naturally
// paced to actual frame timing — never hits this. Without it, drags
// silently do nothing in WebKit runs. Chromium/Firefox don't need it, but
// the wait is harmless there.
const SETTLE_MS = 50;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip boot screen' }).click();
  await page.waitForSelector('[data-testid^="window-"]');
});

test('dragging a window by its titlebar moves it to the drop point', async ({ page }) => {
  const win = page.locator('[data-testid^="window-"]').first();
  const before = await win.boundingBox();
  if (before === null) throw new Error('window not found');

  await page.mouse.move(before.x + 100, before.y + 10);
  await page.mouse.down();
  await page.mouse.move(before.x + 250, before.y + 160, { steps: 12 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // mouse.up() resolving doesn't guarantee React's resulting state update
  // has committed to the DOM yet — poll rather than reading boundingBox()
  // exactly once.
  await expect.poll(async () => (await win.boundingBox())?.x).toBeCloseTo(before.x + 150, 0);
  await expect.poll(async () => (await win.boundingBox())?.y).toBeCloseTo(before.y + 150, 0);
});

test('resizing via the se handle grows the window and reflows its content', async ({ page }) => {
  const win = page.locator('[data-testid^="window-"]').first();
  const before = await win.boundingBox();
  if (before === null) throw new Error('window not found');

  const handle = win.locator('[data-testid="resize-se"]');
  const handleBox = await handle.boundingBox();
  if (handleBox === null) throw new Error('resize handle not found');

  await page.mouse.move(handleBox.x + 2, handleBox.y + 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + 100, handleBox.y + 80, { steps: 10 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect.poll(async () => (await win.boundingBox())?.width).toBeGreaterThan(before.width + 80);
  await expect.poll(async () => (await win.boundingBox())?.height).toBeGreaterThan(before.height + 60);

  // The textarea inside should have reflowed to the new size, not stayed
  // clipped at the old dimensions.
  const textareaBox = await page.getByLabel('Notepad document').boundingBox();
  expect(textareaBox?.width).toBeGreaterThan(before.width - 20);
});

test('resizing never shrinks a window below the minimum size', async ({ page }) => {
  const win = page.locator('[data-testid^="window-"]').first();
  const handle = win.locator('[data-testid="resize-se"]');
  const handleBox = await handle.boundingBox();
  if (handleBox === null) throw new Error('resize handle not found');

  await page.mouse.move(handleBox.x + 2, handleBox.y + 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 1000, handleBox.y - 1000, { steps: 10 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect.poll(async () => (await win.boundingBox())?.width).toBeGreaterThanOrEqual(200);
  await expect.poll(async () => (await win.boundingBox())?.height).toBeGreaterThanOrEqual(150);
});

test('dragging one window causes no visible stutter in another — both remain independently interactive', async ({
  page,
}) => {
  await page.getByText('Start', { exact: true }).click();
  await page.getByRole('menuitem', { name: /Paint/ }).click();

  // Capture stable per-window testids up front — dragging the first window
  // focuses it, which reorders zOrder and thus DOM order, so a position-based
  // locator (nth(0)/nth(1)) would silently start pointing at a different
  // window mid-test. Pin each one to its own testid instead.
  const testIds = await page
    .locator('[data-testid^="window-"]')
    .evaluateAll((els: Element[]) => els.map((el) => el.getAttribute('data-testid')));
  const [firstId, secondId] = testIds;
  if (firstId === undefined || secondId === undefined) throw new Error('expected two windows');

  const first = page.locator(`[data-testid="${firstId}"]`);
  const second = page.locator(`[data-testid="${secondId}"]`);

  const secondBefore = await second.boundingBox();
  const firstTitlebar = first.locator('[data-testid^="titlebar-"]');
  const firstBox = await firstTitlebar.boundingBox();
  if (firstBox === null || secondBefore === null) throw new Error('windows not found');

  await page.mouse.move(firstBox.x + 50, firstBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(firstBox.x + 300, firstBox.y + 200, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // Confirm the drag actually took effect (otherwise this test would trivially
  // "pass" even if dragging were completely broken).
  await expect.poll(async () => (await first.boundingBox())?.x).toBeCloseTo(firstBox.x + 250, -1);

  const secondAfter = await second.boundingBox();
  expect(secondAfter?.x).toBeCloseTo(secondBefore.x, 0);
  expect(secondAfter?.y).toBeCloseTo(secondBefore.y, 0);
});
