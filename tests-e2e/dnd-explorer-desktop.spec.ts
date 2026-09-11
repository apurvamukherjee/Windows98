import { test, expect } from '@playwright/test';

// See drag-resize.spec.ts for why this settle wait precedes every
// mouse.up() below — it's a headless-WebKit requestAnimationFrame timing
// quirk in Playwright's synthetic mouse simulation, not a real-world issue.
const SETTLE_MS = 50;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip boot screen' }).click();
  await page.waitForSelector('[data-testid^="window-"]');
  await page.locator('[data-testid^="window-"]').getByRole('button', { name: 'Close' }).click();
});

test('dragging a desktop folder onto an open Explorer window moves it there', async ({ page }) => {
  await page.mouse.click(700, 500, { button: 'right' });
  await page.getByRole('menuitem', { name: 'New Folder' }).click();

  // Capture the desktop icon's position now, before Explorer opens — once
  // it's open, "New Folder" also matches its toolbar button and tree row,
  // making a by-text query ambiguous.
  const icon = page.getByText('New Folder');
  const box = await icon.boundingBox();
  if (box === null) throw new Error('desktop icon not found');

  await page.getByText('Start', { exact: true }).click();
  await page.getByRole('menuitem', { name: /My Computer/ }).click();
  const explorer = page.locator('[data-testid^="window-"]').last();

  // Reposition Explorer via a real drag rather than poking its DOM style
  // directly — a raw style mutation disagrees with the window store (the
  // actual source of truth) and gets silently reverted by React's very next
  // re-render of this component, whenever that happens to land.
  const explorerTitlebar = explorer.locator('[data-testid^="titlebar-"]');
  const explorerTitlebarBox = await explorerTitlebar.boundingBox();
  if (explorerTitlebarBox === null) throw new Error('explorer titlebar not found');
  await page.mouse.move(explorerTitlebarBox.x + 100, explorerTitlebarBox.y + explorerTitlebarBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(560, 90, { steps: 10 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // Grabbed the titlebar 100px in from its left edge and dropped that same
  // grab point at x=560, so the window's own left edge lands at 560-100=460
  // regardless of where it started.
  await expect.poll(async () => (await explorer.boundingBox())?.x).toBeCloseTo(460, -1);
  const explorerBox = await explorer.boundingBox();
  if (explorerBox === null) throw new Error('explorer window not found');

  await page.mouse.move(box.x + 10, box.y - 10);
  await page.mouse.down();
  await page.mouse.move(explorerBox.x + explorerBox.width / 2, explorerBox.y + explorerBox.height / 2, {
    steps: 15,
  });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  // "📁New Folder" (glyph and name with no space between, per DesktopIcon's
  // and Explorer's icon-grid markup) matches only an icon-grid entry — never
  // the toolbar's "New Folder" button or the folder tree's row (which has a
  // literal space: "📁 New Folder"). It moved into the Explorer's listing,
  // not left behind on the desktop, so there's now exactly one such match.
  await expect.poll(() => page.getByText('📁New Folder').count()).toBe(1);
  await expect(explorer.getByText('📁New Folder')).toBeVisible();
});

test('dragging a file out of Explorer onto the desktop moves it there', async ({ page }) => {
  const textarea = page.getByLabel('Notepad document');
  await page.getByText('Start', { exact: true }).click();
  await page.getByRole('menuitem', { name: /Notepad/ }).click();
  await textarea.click();
  await textarea.fill('hi');
  await page.locator('[data-testid^="window-"]').getByRole('button', { name: 'Save' }).click();
  await page.getByLabel('File name').fill('out.txt');
  await page.getByRole('button', { name: 'Save' }).last().click();
  await page.locator('[data-testid^="window-"]').getByRole('button', { name: 'Close' }).click();

  await page.getByText('Start', { exact: true }).click();
  await page.getByRole('menuitem', { name: /My Computer/ }).click();
  const explorer = page.locator('[data-testid^="window-"]').last();
  await explorer.getByRole('button', { name: /Documents/ }).dblclick();

  const fileButton = explorer.getByText('out.txt');
  const box = await fileButton.boundingBox();
  if (box === null) throw new Error('file not found in Explorer');

  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(700, 550, { steps: 15 });
  await page.waitForTimeout(SETTLE_MS);
  await page.mouse.up();

  await expect(page.getByText('out.txt')).toHaveCount(1);
  await expect(explorer.getByText('out.txt')).not.toBeVisible();
});
