import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email', { exact: true }).fill('maker@example.test');
  await page.getByLabel('Password', { exact: true }).fill('E2ePassword123!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/main\/discover/);
}

test('real login, profile, friends and logout', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(page.getByText('maker@example.test', { exact: true })).toBeVisible();
  const profile = await page.request.get('http://localhost:3000/auth/details');
  expect(profile.ok()).toBe(true);
  expect((await profile.json()).userData).not.toHaveProperty('password');
  await page.goto('/main/friends_section/friends');
  await expect(page.getByText('Other Maker', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.goto('/main/profile');
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.goto('/main/profile');
  await expect(page).toHaveURL(/auth\/login/);
});

test('real DM sends via Socket.IO, persists, edits and deletes', async ({ page }) => {
  await login(page);
  await page.goto('/main/direct_message?friendId=000000000000000000000002');
  await expect(page.getByText('Other Maker', { exact: true }).first()).toBeVisible();
  const text = `Live message ${Date.now()}`;
  await page.locator('app-chat-composer input').fill(text);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  const history = await page.request.get('http://localhost:3000/chat/messages/000000000000000000000001_000000000000000000000002');
  const message = (await history.json()).find((m: any) => m.content === text);
  const edited = await page.request.patch(`http://localhost:3000/chat/messages/${message._id}`, { data: { content: text + ' edited' } });
  expect(edited.ok()).toBe(true);
  await expect(page.getByText(text + ' edited', { exact: true })).toBeVisible();
  expect((await page.request.delete(`http://localhost:3000/chat/messages/${message._id}`)).ok()).toBe(true);
  await expect(page.getByText(text + ' edited', { exact: true })).not.toBeVisible();
});

test('real community roles, channel chat and voice lobby', async ({ page }) => {
  await login(page);
  await page.goto('/main/community/000000000000000000000010/about');
  await page.getByRole('button', { name: 'Roles', exact: true }).click();
  const roles = page.getByRole('dialog', { name: 'Community roles' });
  await roles.getByRole('button', { name: 'New role', exact: true }).click();
  await roles.locator('input[type=text]').fill('E2E custom role');
  await roles.getByRole('button', { name: 'Save', exact: true }).click();
  const roleRow = roles.getByRole('listitem').filter({ hasText: 'E2E custom role' });
  await expect(roleRow).toBeVisible();
  await roleRow.getByRole('button', { name: 'Edit', exact: true }).click();
  await roles.locator('input[type=text]').fill('E2E renamed role');
  await roles.getByRole('button', { name: 'Save', exact: true }).click();
  await roles.getByRole('listitem').filter({ hasText: 'E2E renamed role' }).getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog', { name: 'Delete role' }).getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(roles.getByText('E2E renamed role', { exact: true })).not.toBeVisible();
  await roles.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/main/community/000000000000000000000010/chatroom/000000000000000000000030');
  const text = `Channel message ${Date.now()}`;
  await page.locator('app-chat-composer input').fill(text);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await page.goto('/main/community/000000000000000000000010/voiceroom/000000000000000000000031');
  await expect(page.getByRole('button', { name: 'Join voice room', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expand voice room' }).click();
  await expect(page.getByRole('button', { name: 'Collapse voice room' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Expand voice room' })).toBeVisible();

  // Exercise lifecycle APIs against the same disposable DB, with real RBAC.
  const invalid = await page.request.post('http://localhost:3000/community/create', { data: { data: { name: 'x' } } });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).errorField).toBe('imageUrl');
  expect((await page.request.post('http://localhost:3000/community/create', { data: {} })).status()).toBe(400);
  expect((await page.request.post('http://localhost:3000/channel/create/000000000000000000000010', { data: { data: { name: 'x' } } })).status()).toBe(400);
  expect((await page.request.put('http://localhost:3000/channel/update/000000000000000000000010/000000000000000000000030', { data: { data: { name: 'x' } } })).status()).toBe(400);
  expect((await page.request.put('http://localhost:3000/profile/avatar', { data: { imageUrl: 'not-a-url' } })).status()).toBe(400);
  const name = `Lifecycle ${Date.now()}`;
  const create = await page.request.post('http://localhost:3000/community/create', { data: { data: {
    name, type: 'private', description: 'Disposable E2E community', tags: [],
    imageUrl: 'http://localhost:4200/assets/images/Logo-bg-white.png', coverImageUrl: 'http://localhost:4200/assets/images/Logo-bg-white.png',
  } } });
  expect(create.status()).toBe(201);
  const id = (await create.json()).community._id;
  expect((await page.request.put(`http://localhost:3000/community/update/${id}`, { data: { data: { name: 'x' } } })).status()).toBe(400);
  const update = await page.request.put(`http://localhost:3000/community/update/${id}`, { data: { data: { description: 'Updated by E2E' } } });
  expect(update.ok()).toBe(true);
  expect((await update.json()).updatedCommunity.description).toBe('Updated by E2E');
  const owned = await page.request.get('http://localhost:3000/community/user');
  expect((await owned.json()).communities.some((c: any) => c._id === id)).toBe(true);
  expect((await page.request.delete(`http://localhost:3000/community/delete/${id}`)).ok()).toBe(true);
  expect((await page.request.get(`http://localhost:3000/community/${id}`)).status()).toBe(404);
});

test('real API rejects unauthenticated and nonmember access', async ({ request }) => {
  expect((await request.get('http://localhost:3000/auth/details')).status()).toBe(401);
  const login = await request.post('http://localhost:3000/auth/login', { data: { email: 'new@example.test', password: 'E2ePassword123!' } });
  expect(login.ok()).toBe(true);
  const channels = await request.get('http://localhost:3000/channel/list/000000000000000000000010');
  expect(channels.status()).toBe(404);
  expect((await channels.json()).message).toBe('User has no roles in this community');
  const dm = await request.get('http://localhost:3000/chat/messages/000000000000000000000001_000000000000000000000002');
  expect(dm.status()).toBe(401);
});
