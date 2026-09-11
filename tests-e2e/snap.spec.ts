import { test, expect } from '@playwright/test';

// See drag-resize.spec.ts for why this settle wait precedes every
// mouse.up() below — it's a headless-WebKit requestAnimationFrame timing
// quirk in Playwright's synthetic mouse simulation, not a real-world issue.
const SETTLE_MS = 50;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip boot screen' }).click();
  await page.waitForSelector('[data-testid^="window-"]');
});

test('dragging a window to the left edge snaps it to the left half of the screen', async ({ page }) => {
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('no viewport');

  const win = page.locator('[data-testid^="window-"]').first();
  const titlebar = win.locator('[data-testid^="titlebar-"]');
  const box = await titlebar.boundingBox();
  if (box === null) throw new Error('titlebar not found');

  await page.mouse.move(box.x + 100, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(5, 300, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // mouse.up() resolving doesn't guarantee React's resulting state update
  // has committed to the DOM yet — poll rather than reading boundingBox()
  // exactly once.
  await expect.poll(async () => (await win.boundingBox())?.x).toBeCloseTo(0, 0);
  await expect.poll(async () => (await win.boundingBox())?.width).toBeCloseTo(viewport.width / 2, 0);
});

test('dragging a window to the right edge snaps it to the right half', async ({ page }) => {
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('no viewport');

  const win = page.locator('[data-testid^="window-"]').first();
  const titlebar = win.locator('[data-testid^="titlebar-"]');
  const box = await titlebar.boundingBox();
  if (box === null) throw new Error('titlebar not found');

  await page.mouse.move(box.x + 100, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(viewport.width - 5, 300, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect.poll(async () => (await win.boundingBox())?.x).toBeGreaterThan(viewport.width / 2 - 10);
});

test('dragging to the top edge maximizes the window', async ({ page }) => {
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('no viewport');

  const win = page.locator('[data-testid^="window-"]').first();
  const titlebar = win.locator('[data-testid^="titlebar-"]');
  const box = await titlebar.boundingBox();
  if (box === null) throw new Error('titlebar not found');

  await page.mouse.move(box.x + 100, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, 2, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect.poll(async () => (await win.boundingBox())?.x).toBeCloseTo(0, 0);
  await expect.poll(async () => (await win.boundingBox())?.width).toBeCloseTo(viewport.width, 0);
});

test('dragging a snapped window away restores it to its original floating size', async ({ page }) => {
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('no viewport');

  const win = page.locator('[data-testid^="window-"]').first();
  const titlebar = win.locator('[data-testid^="titlebar-"]');
  const before = await win.boundingBox();
  if (before === null) throw new Error('window not found');

  let box = await titlebar.boundingBox();
  if (box === null) throw new Error('titlebar not found');
  await page.mouse.move(box.x + 100, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(5, 300, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // Poll for the *exact* settled snap target, not just "no longer 380" —
  // the snap-settle itself now animates via CSS transition (M10 polish),
  // so a vague "not equal to before" condition can resolve mid-transition,
  // before the titlebar has actually reached its final on-screen position.
  await expect.poll(async () => (await win.boundingBox())?.width).toBeCloseTo(viewport.width / 2, 0);
  await expect.poll(async () => (await win.boundingBox())?.x).toBeCloseTo(0, 0);

  box = await titlebar.boundingBox();
  if (box === null) throw new Error('titlebar not found');
  await page.mouse.move(box.x + 50, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(400, 300, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect.poll(async () => (await win.boundingBox())?.width).toBeCloseTo(before.width, 0);
  await expect.poll(async () => (await win.boundingBox())?.height).toBeCloseTo(before.height, 0);
});
