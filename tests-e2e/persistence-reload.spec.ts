import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('[data-testid^="window-"]');
});

test('saved text survives a reload', async ({ page }) => {
  const textarea = page.getByLabel('Notepad document').first();
  await textarea.click();
  await textarea.fill('Persisted across reload.');

  // Let the debounced save fire.
  await page.waitForTimeout(700);
  await page.reload();

  await expect(page.getByLabel('Notepad document').first()).toHaveValue('Persisted across reload.');
});

test('a moved desktop icon keeps its position after reload', async ({ page }) => {
  // (700, 500) is deliberately clear of the default boot window
  // (Notepad opens at 80,60–460,320) — right-clicking inside a window
  // never reaches the desktop's own context menu.
  await page.mouse.click(700, 500, { button: 'right' });
  await page.getByRole('menuitem', { name: 'New Folder' }).click();

  const icon = page.getByText('New Folder');
  const box = await icon.boundingBox();
  if (box === null) throw new Error('icon not found');

  await page.mouse.move(box.x + 10, box.y - 10);
  await page.mouse.down();
  await page.mouse.move(600, 500, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(700);
  await page.reload();

  const restoredBox = await page.getByText('New Folder').boundingBox();
  expect(restoredBox?.x).toBeGreaterThan(400);
});

test('Reset Desktop clears saved state back to a fresh boot', async ({ page }) => {
  const textarea = page.getByLabel('Notepad document').first();
  await textarea.click();
  await textarea.fill('This should not survive a reset.');
  await page.waitForTimeout(700);

  await page.getByText('Start', { exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('menuitem', { name: 'Reset Desktop' }).click();

  await page.waitForSelector('[data-testid^="window-"]');
  await expect(page.getByLabel('Notepad document').first()).toHaveValue('');
});
