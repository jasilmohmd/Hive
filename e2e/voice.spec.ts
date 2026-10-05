import { test, expect, voiceChannel, community, friend } from './fixtures';

test('voice-room token failure can be retried without leaving the lobby', async ({ page, api }) => {
  let attempts = 0;
  await page.route('**/voiceroom/*/token', async route => { attempts++; await route.fulfill({ status: 503, json: { message: 'Voice service temporarily unavailable' } }); });
  await page.goto(`/main/community/${community._id}/voiceroom/${voiceChannel._id}`);
  await page.getByRole('button', { name: 'Join voice room', exact: true }).click();
  await expect(page.getByText('Voice service temporarily unavailable', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Join voice room', exact: true }).click();
  await expect.poll(() => attempts).toBe(2);
});

test('incoming direct call is declined while voice-room setup owns the microphone', async ({ page, api }) => {
  let sendIncoming!: () => void;
  let rejected = false;
  await page.routeWebSocket('**/socket.io/**', ws => {
    ws.send('0' + JSON.stringify({ sid: 'media-fixture', upgrades: [], pingInterval: 25000, pingTimeout: 20000 }));
    sendIncoming = () => ws.send('42' + JSON.stringify(['call:incoming', { callId: 'incoming-fixture', chatId: 'fixture-chat', callerId: friend._id, callType: 'audio' }]));
    ws.onMessage(data => {
      const message = String(data);
      if (message.startsWith('40')) ws.send('40' + JSON.stringify({ sid: 'media-fixture' }));
      if (message.startsWith('42') && JSON.parse(message.slice(2))[0] === 'call:reject') rejected = true;
    });
  });
  await page.route('**/voiceroom/*/token', async route => {
    sendIncoming();
    await expect.poll(() => rejected).toBe(true);
    await route.fulfill({ status: 503, json: { message: 'Voice service temporarily unavailable' } });
  });
  await page.goto(`/main/community/${community._id}/voiceroom/${voiceChannel._id}`);
  await page.getByRole('button', { name: 'Join voice room', exact: true }).click();
  await expect.poll(() => rejected).toBe(true);
  await expect(page.getByRole('alertdialog')).not.toBeVisible();
  await expect(page.getByText('Voice service temporarily unavailable', { exact: true })).toBeVisible();
});

test('incoming calls still work after logout and login in the same tab', async ({ page, api }) => {
  let sendIncoming!: () => void;
  let connections = 0;
  await page.routeWebSocket('**/socket.io/**', ws => {
    connections++;
    ws.send('0' + JSON.stringify({ sid: `session-${connections}`, upgrades: [], pingInterval: 25000, pingTimeout: 20000 }));
    sendIncoming = () => ws.send('42' + JSON.stringify(['call:incoming', { callId: 'relogin-call', chatId: 'fixture-chat', callerId: friend._id, callType: 'audio' }]));
    ws.onMessage(data => { if (String(data).startsWith('40')) ws.send('40' + JSON.stringify({ sid: `session-${connections}` })); });
  });
  await page.goto('/main/profile');
  await expect.poll(() => connections).toBe(1);
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.getByLabel('Email', { exact: true }).fill('maker@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/main\/discover/);
  await expect.poll(() => connections).toBe(2);
  await page.waitForLoadState('networkidle');
  sendIncoming();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  await expect(page.getByRole('alertdialog')).not.toBeVisible();
});
