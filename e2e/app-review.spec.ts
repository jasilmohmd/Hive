import { test, expect, mockApi, community, voiceChannel } from './fixtures';

const routes = [
  '/main/discover', '/main/profile', '/main/edit_profile', '/main/change_password',
  '/main/friends_section/friends', '/main/friends_section/online', '/main/friends_section/pending',
  '/main/friends_section/blocked', '/main/friends_section/addfriend', '/main/direct_message',
  '/main/community/create/step-one', `/main/community/${community._id}/about`,
  `/main/community/${community._id}/voiceroom/${voiceChannel._id}`,
];
for (const path of routes) {
  test(`route renders without runtime errors or overflow: ${path}`, async ({ page, api }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: info.outputPath('review.png'), fullPage: true });
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test('community sidebar defaults to readable mobile content and preserves its toggle', async ({ page, api }) => {
  await page.goto(`/main/community/${community._id}/about`);
  await page.waitForLoadState('networkidle');
  const sidebar = page.locator('#community-channels');
  const mobile = page.viewportSize()!.width < 768;
  if (mobile) {
    await expect(sidebar).not.toBeVisible();
    const content = await page.locator('community-layout > div > div').last().boundingBox();
    expect(content!.width).toBeGreaterThan(page.viewportSize()!.width * 0.9);
    await page.getByRole('button', { name: 'Channels', exact: true }).click();
    await expect(sidebar).toBeVisible();
    await page.reload();
    await expect(sidebar).not.toBeVisible();
    await page.getByRole('button', { name: 'Channels', exact: true }).click();
    await page.getByRole('button', { name: 'Close channels', exact: true }).click();
    await expect(sidebar).not.toBeVisible();
    return;
  } else {
    await expect(sidebar).toBeVisible();
  }
  await page.getByRole('button', { name: 'Hide channels', exact: true }).click();
  await expect(sidebar).not.toBeVisible();
  await page.reload();
  await expect(sidebar).not.toBeVisible();
});

test('login validation and successful navigation', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/auth/login');
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeDisabled();
  await page.getByLabel('Email', { exact: true }).fill('maker@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/main\/discover/);
});

test('discover search, empty state and clear filters', async ({ page, api }) => {
  await page.goto('/main/discover');
  await page.getByRole('searchbox', { name: 'Search communities' }).fill('no-such-community');
  await expect(page.getByText('No matches', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('heading', { name: community.name })).toBeVisible();
});

test('discover last card remains reachable', async ({ page, api }) => {
  await page.goto('/main/discover');
  const last = page.getByRole('heading', { name: 'Community 11', exact: true });
  await expect(last).toBeAttached();
  await page.mouse.move(250, 400);
  await page.mouse.wheel(0, 5000);
  await expect(last).toBeInViewport();
});

test('community wizard closes and validates the first step', async ({ page, api }) => {
  await page.goto('/main/discover');
  await page.getByRole('button', { name: /^(Create community|Create)$/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Name is required', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Enter community name').fill('Test community');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Step 2 of 3')).toBeVisible();
  await page.getByRole('button', { name: 'Close create community dialog' }).click();
  await expect(page.getByText('Step 2 of 3')).not.toBeVisible();
});
