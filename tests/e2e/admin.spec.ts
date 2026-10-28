import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('admin routes return 404 to anonymous and normal sessions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  expect((await page.request.get('/admin-login')).status()).toBe(200);
  expect((await page.request.get('/admin')).status()).toBe(404);
  expect((await page.request.get('/api/admin/users')).status()).toBe(404);
  await loginAsDemo(page);
  expect((await page.request.get('/api/admin/users')).status()).toBe(404);
  expect((await page.request.get('/admin')).status()).toBe(404);
});

test('development admin can view users and every change appends an audit entry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const login = await page.request.post('/api/admin/session', { data: { email: 'admin@invite.test', password: 'Admin@1234' } });
  expect(login.ok()).toBeTruthy();
  expect((await page.request.get('/api/admin/users')).ok()).toBeTruthy();
  const before = await page.request.get('/api/admin/audit');
  expect(before.ok()).toBeTruthy();
  const users = await (await page.request.get('/api/admin/users?includeDemo=1')).json() as { users: Array<{ id: string; role: string }> };
  const user = users.users.find(row => row.role === 'user');
  expect(user).toBeTruthy();
  const update = await page.request.patch(`/api/admin/users/${user!.id}`, { data: { action: 'plan', plan: 'pro', plan_until: null } });
  expect(update.ok()).toBeTruthy();
  const audit = await (await page.request.get('/api/admin/audit')).json() as Array<{ target_id: string; action: string }>;
  expect(audit.some(row => row.target_id === user!.id && row.action === 'user.plan.changed')).toBeTruthy();
});
