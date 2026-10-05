import { test as base, expect, Page } from '@playwright/test';

export const user = { _id: '000000000000000000000001', userName: 'Test Maker', email: 'maker@example.test' };
export const friend = { _id: '000000000000000000000002', userName: 'Other Maker', email: 'other@example.test' };
export const voiceChannel = { _id: '000000000000000000000031', name: 'Voice Lounge', type: 'voiceroom', communityId: '000000000000000000000010', maxParticipants: 6 };
export const community = {
  _id: '000000000000000000000010', name: 'Maker Community', description: 'A place to build together',
  type: 'public', ownerId: user, createdAt: '2026-01-01T00:00:00Z', imageUrl: '/assets/images/Logo-bg-white.png',
  coverImageUrl: '/assets/images/Logo-bg-white.png', tags: [{ _id: 'tag1', name: 'Technology' }],
  members: [{ userId: user, roles: [] }], joinRequests: [], channels: [],
};

export async function mockApi(page: Page, authenticated = true) {
  const unexpected: string[] = [];
  let loggedIn = authenticated;
  await page.routeWebSocket('**/socket.io/**', ws => {
    ws.send('0' + JSON.stringify({ sid: 'fixture', upgrades: [], pingInterval: 25000, pingTimeout: 20000, maxPayload: 1000000 }));
    ws.onMessage(data => {
      const message = String(data);
      if (message.startsWith('40')) ws.send('40' + JSON.stringify({ sid: 'fixture' }));
      if (message === '2') ws.send('3');
    });
  });
  await page.route('http://localhost:3000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    let status = 200;
    if (path === '/auth/isUserAuthenticated') { body = loggedIn ? { message: 'Authenticated', token: 'fixture' } : { message: 'Unauthenticated' }; status = loggedIn ? 200 : 401; }
    else if (path === '/auth/login') { loggedIn = true; body = { message: 'Logged in', token: 'fixture' }; }
    else if (path === '/auth/logout') { loggedIn = false; body = { message: 'Logged out' }; }
    else if (path === '/auth/details') body = { userData: user };
    else if (path.startsWith('/auth/userDetails/')) body = { userData: friend };
    else if (path === '/auth/realtime-token') body = { token: 'fixture' };
    else if (path === '/community/user') body = { communities: [community] };
    else if (path === '/community/') body = { communities: Array.from({ length: 12 }, (_, i) => ({ ...community, _id: community._id.slice(0, -2) + String(i + 10), name: i ? `Community ${i}` : community.name })) };
    else if (path === '/community/tags') body = { tags: community.tags };
    else if (path === `/community/${community._id}`) body = { community };
    else if (path.startsWith('/role/')) body = { roles: [], userRoles: [] };
    else if (path.startsWith('/channel/list/')) body = { groupedChannels: { info: [], chatroom: [], voiceroom: [voiceChannel] } };
    else if (path === `/channel/${voiceChannel._id}`) body = voiceChannel;
    else if (path === `/voiceroom/${voiceChannel._id}/presence`) body = { participants: [], maxParticipants: 6 };
    else if (path.startsWith('/chat/messages/')) body = [];
    else if (path === '/friends/all') body = { friends: [friend] };
    else if (path === '/friends/online') body = { onlineFriends: [friend] };
    else if (path === '/friends/pending_requests') body = { pendingRequests: [{ sender: friend }] };
    else if (path === '/friends/blocked/') body = { blockedUsers: [friend] };
    else if (path === '/friends/search') body = { users: [friend] };
    else if (path === '/call/ice-config') body = { iceServers: [] };
    else { unexpected.push(`${route.request().method()} ${path}`); status = 501; body = { message: `Unmocked API: ${path}` }; }
    await route.fulfill({ status, json: body });
  });
  return unexpected;
}

export const test = base.extend<{ api: string[] }>({
  page: async ({ page }, use) => {
    // Keep fixture checks independent of third-party font delivery.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await use(page);
  },
  api: async ({ page }, use) => { const unexpected = await mockApi(page); await use(unexpected); expect(unexpected, 'Every API fixture must be explicit').toEqual([]); },
});
export { expect };
