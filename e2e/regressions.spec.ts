import { test, expect, community } from './fixtures';
import path from 'node:path';

async function completeWizard(page: import('@playwright/test').Page) {
  await page.goto('/main/discover');
  await page.getByRole('button', { name: 'Create community', exact: true }).click();
  await page.getByPlaceholder('Enter community name').fill('New maker group');
  await page.getByRole('button', { name: 'Continue' }).click();
  for (let i = 0; i < 2; i++) {
    await page.locator('community-create-step-two input[type=file]').nth(i).setInputFiles(path.resolve('client/src/assets/images/Logo-bg-white.png'));
    await expect(page.locator('image-cropper img').first()).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(page.locator('image-cropper')).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Technology', exact: true }).click();
}

test('wizard submits and refreshes membership after successful creation', async ({ page, api }) => {
  let created = 0;
  let sidebarLoads = 0;
  await page.route('**/community/user', async route => { sidebarLoads++; await route.fulfill({ json: { communities: [community] } }); });
  await page.route('**/image/upload', route => route.fulfill({ json: { imageUrl: '/assets/images/Logo-bg-white.png' } }));
  await page.route('**/community/create', async route => { created++; expect(route.request().postDataJSON().data.tags).toEqual(['tag1']); await route.fulfill({ json: { community } }); });
  await completeWizard(page);
  await page.getByRole('button', { name: 'Create Community', exact: true }).click();
  await expect.poll(() => created).toBe(1);
  await expect(page.getByText('Step 3 of 3')).not.toBeVisible();
  expect(sidebarLoads).toBeGreaterThan(1);
});

test('wizard can retry after an upload failure', async ({ page, api }) => {
  await page.route('**/image/upload', route => route.fulfill({ status: 400, json: { message: 'Image upload failed' } }));
  await completeWizard(page);
  await page.getByRole('button', { name: 'Create Community', exact: true }).click();
  await expect(page.getByText('Image upload failed', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Community', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Close create community dialog' }).click();
  await expect(page.getByText('Step 3 of 3')).not.toBeVisible();
});

test('profile load failure has a visible error instead of an unhandled exception', async ({ page, api }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/auth/details', route => route.fulfill({ status: 503, json: { message: 'Profile temporarily unavailable' } }));
  await page.goto('/main/profile');
  await expect(page.getByText('Profile temporarily unavailable', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('community load failure displays an actionable message', async ({ page, api }) => {
  await page.route(`**/community/${community._id}`, route => route.fulfill({ status: 404, json: { message: 'Community not found' } }));
  await page.goto(`/main/community/${community._id}/about`);
  await expect(page.getByText('Community could not be loaded. It may have been deleted or you may not have access.')).toBeVisible();
});

test('routed wizard can be dismissed', async ({ page, api }) => {
  await page.goto('/main/community/create/step-one');
  await page.getByRole('button', { name: 'Close create community dialog' }).click();
  await expect(page).toHaveURL(/main\/discover/);
});

test('wizard Escape dismissal and step-one description validation', async ({ page, api }) => {
  await page.goto('/main/discover');
  await page.getByRole('button', { name: 'Create community', exact: true }).click();
  await page.getByPlaceholder('Enter community name').fill('Maker group');
  await page.getByPlaceholder('Describe your community...').fill('x'.repeat(501));
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Step 1 of 3')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Step 1 of 3')).not.toBeVisible();
});
