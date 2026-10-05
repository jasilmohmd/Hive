import { test, expect, mockApi, friend, community } from './fixtures';

for (const route of ['/', '/auth/login', '/auth/email_verify', '/auth/otp', '/auth/register', '/auth/change_pass', '/styleguide']) {
  test(`public screen renders: ${route}`, async ({ page }, info) => {
    await mockApi(page, false);
    await page.goto(route);
    await expect(page.locator('body')).not.toBeEmpty();
    await page.screenshot({ path: info.outputPath('review.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('registration rejects a password shorter than the server minimum', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/auth/register');
  await page.getByLabel('Username', { exact: true }).fill('New Maker');
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByLabel('Confirm password', { exact: true }).fill('123456');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('OTP requires six digits, not letters', async ({ page }) => {
  await mockApi(page, false);
  await page.goto('/auth/otp');
  await page.getByLabel('6-digit code').fill('abcdef');
  await expect(page.getByRole('button', { name: 'Verify', exact: true })).toBeDisabled();
  await page.getByLabel('6-digit code').fill('123456');
  await expect(page.getByRole('button', { name: 'Verify', exact: true })).toBeEnabled();
});

test('forgot-password flow verifies OTP and resets password', async ({ page }) => {
  await mockApi(page, false);
  for (const endpoint of ['send-otp', 'otp_verify', 'set_new_password']) {
    await page.route(`**/auth/${endpoint}`, route => route.fulfill({ json: { message: 'Success' } }));
  }
  await page.goto('/auth/login');
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await page.getByLabel('Email', { exact: true }).fill('maker@example.test');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/auth\/otp/);
  await page.getByLabel('6-digit code').fill('123456');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page).toHaveURL(/auth\/change_pass/);
  await page.getByLabel('New password', { exact: true }).fill('newpassword123');
  await page.getByLabel('Confirm password', { exact: true }).fill('newpassword123');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page).toHaveURL(/auth\/login/);
});

test('profile edits and password mismatch validation', async ({ page, api }) => {
  await page.route('**/profile/edit_profile', async route => {
    expect(route.request().postDataJSON()).toEqual({ newUserName: 'Updated Maker' });
    await route.fulfill({ json: { message: 'Profile updated' } });
  });
  await page.goto('/main/edit_profile');
  await page.getByLabel('Username', { exact: true }).fill('Updated Maker');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page).toHaveURL(/main\/profile/);
  await page.getByRole('link', { name: 'Change Password', exact: true }).click();
  await page.getByLabel('Old Password', { exact: true }).fill('password123');
  await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
  await page.getByLabel('Confirm Password', { exact: true }).fill('different123');
  await expect(page.getByText('New Password and Confirm Password do not match.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change Password', exact: true })).toBeDisabled();
});

test('friend search and request send', async ({ page, api }) => {
  await page.route('**/friends/request', async route => { expect(route.request().postDataJSON()).toEqual({ receiverId: friend._id }); await route.fulfill({ json: { success: true } }); });
  await page.goto('/main/friends_section/addfriend');
  await page.getByRole('searchbox', { name: 'Search by username' }).fill('Other');
  await page.getByRole('button', { name: 'Send Request' }).click();
  await expect(page.getByText('Friend request sent', { exact: true })).toBeVisible();
});

test('pending request acceptance updates the list', async ({ page, api }) => {
  let accepted = false;
  await page.route('**/friends/pending_requests', route => route.fulfill({ json: { pendingRequests: accepted ? [] : [{ sender: friend }] } }));
  await page.route('**/friends/accept_request', async route => { accepted = true; await route.fulfill({ json: { success: true } }); });
  await page.goto('/main/friends_section/pending');
  await expect(page.getByText(friend.userName, { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect.poll(() => accepted).toBe(true);
  await expect(page.getByText(friend.userName, { exact: true })).toHaveCount(0);
  await expect(page.getByText('No pending requests', { exact: true })).toBeVisible();
});

test('blocked user error is visible', async ({ page, api }) => {
  await page.route('**/friends/blocked/', route => route.fulfill({ status: 503, json: { message: 'Try later' } }));
  await page.goto('/main/friends_section/blocked');
  await expect(page.getByText('Failed to load blocked users.', { exact: true })).toBeVisible();
});

test('confirmation dialog dismisses with Escape while focused inside it', async ({ page, api }) => {
  await page.goto('/main/friends_section/blocked');
  await page.getByRole('button', { name: 'Unblock', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Unblock user?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('pending request load error is visible', async ({ page, api }) => {
  await page.route('**/friends/pending_requests', route => route.fulfill({ status: 503, json: { message: 'Try later' } }));
  await page.goto('/main/friends_section/pending');
  await expect(page.getByText('Failed to load pending requests', { exact: true })).toBeVisible();
});

test('friend search ignores responses for a previous username', async ({ page, api }) => {
  let started!: () => void;
  let finished!: () => void;
  const oldStarted = new Promise<void>(resolve => { started = resolve; });
  const oldFinished = new Promise<void>(resolve => { finished = resolve; });
  await page.route('**/friends/search?*', async route => {
    const term = new URL(route.request().url()).searchParams.get('username');
    if (term === 'old') {
      started();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: { users: [{ ...friend, userName: 'Old result' }] } }).catch(() => undefined);
      finished();
    } else await route.fulfill({ json: { users: [{ ...friend, userName: 'Current result' }] } });
  });
  await page.goto('/main/friends_section/addfriend');
  await page.getByRole('searchbox', { name: 'Search by username' }).fill('old');
  await oldStarted;
  await page.getByRole('searchbox', { name: 'Search by username' }).fill('current');
  await expect(page.getByText('Current result', { exact: true }).filter({ visible: true })).toBeVisible();
  await oldFinished;
  await expect(page.getByText('Old result', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByText('Current result', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('DM attachment and poll panels open and dismiss', async ({ page, api }) => {
  await page.goto(`/main/direct_message?friendId=${friend._id}`);
  await page.getByRole('button', { name: 'Attach', exact: true }).click();
  await page.getByRole('button', { name: 'Poll', exact: true }).click();
  await expect(page.getByText('Create poll', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send poll' }).click();
  await expect(page.getByText('Enter a question', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Create poll', { exact: true })).not.toBeVisible();
});

for (const [route, expected] of [['/main', '/main/friends_section/friends'], ['/main/friends_section', '/main/friends_section/friends']]) {
  test(`default route redirects: ${route}`, async ({ page, api }) => {
    await page.goto(route);
    await expect(page).toHaveURL('http://localhost:4200' + expected);
  });
}
