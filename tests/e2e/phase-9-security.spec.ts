import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

async function createUserB(page: import('@playwright/test').Page) {
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('User B Security');
  await page.getByLabel('Email', { exact: true }).fill('user-b-security@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('SecurePass123');
  await page.getByLabel('Confirm password').fill('SecurePass123');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard');
}

test('user B and anonymous requests cannot read or mutate user A invitations or guests', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'security ownership checks run once');
  test.setTimeout(120_000);
  await createUserB(page);
  const invitationResponse = await page.request.get('/api/invitations/inv-001');
  expect(invitationResponse.status()).toBe(404);
  const guestsResponse = await page.request.get('/api/invitations/inv-001/guests');
  expect(guestsResponse.status()).toBe(404);

  const bPage = page;
  const ownerlessId = 'guest-001';
  expect((await bPage.request.patch('/api/invitations/inv-001', { data: { title: 'Hacked title' } })).status()).toBe(404);
  expect((await bPage.request.delete('/api/invitations/inv-001')).status()).toBe(404);
  expect((await bPage.request.patch(`/api/guests/${ownerlessId}`, { data: { name: 'Hacked guest' } })).status()).toBe(404);
  expect((await bPage.request.delete(`/api/guests/${ownerlessId}`)).status()).toBe(404);

  await page.goto('/invitations/inv-001');
  await expect(page.getByRole('heading', { name: 'Invitation not found' })).toBeVisible();
  await expect(page.getByText('Amaya & Dilan\'s Wedding')).toHaveCount(0);

  const anonymousContext = await browser.newContext();
  const anonymous = await anonymousContext.newPage();
  await anonymous.goto('about:blank');
  expect((await anonymous.request.get('http://localhost:3000/api/invitations/inv-001')).status()).toBe(401);
  expect((await anonymous.request.get('http://localhost:3000/api/invitations/inv-001/guests')).status()).toBe(401);
  expect((await anonymous.request.patch('http://localhost:3000/api/invitations/inv-001', { data: { title: 'No session' } })).status()).toBe(401);
  expect((await anonymous.request.delete('http://localhost:3000/api/invitations/inv-001')).status()).toBe(401);
  await anonymousContext.close();

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await loginAsDemo(ownerPage);
  const untouched = await (await ownerPage.request.get('/api/invitations/inv-001')).json() as { title: string };
  expect(untouched.title).toBe("Amaya & Dilan's Wedding");
  await ownerContext.close();
});

test('public guest data is minimal and 200 random personal codes never resolve', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'public payload and code-guessing checks run once');
  test.setTimeout(120_000);
  await loginAsDemo(page);
  const guests = await (await page.request.get('/api/invitations/inv-001/guests')).json() as Array<{ code: string; name: string; phone: string; email?: string }>;
  const ownGuest = guests[0];
  const publicResponse = await page.request.get(`/api/links/guest/${ownGuest.code}`);
  expect(publicResponse.ok()).toBeTruthy();
  const publicData = await publicResponse.json() as { guest: Record<string, unknown>; invitation: Record<string, unknown> };
  expect(publicData.guest).toMatchObject({ name: ownGuest.name });
  expect(publicData.guest).not.toHaveProperty('phone');
  expect(publicData.guest).not.toHaveProperty('email');
  expect(publicData.guest).not.toHaveProperty('code');
  expect(publicData.guest).not.toHaveProperty('personalToken');
  expect(JSON.stringify(publicData)).not.toContain(guests[1].phone);
  expect(JSON.stringify(publicData)).not.toContain(guests[1].code);

  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  for (let index = 0; index < 200; index += 1) {
    const code = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    if (guests.some((guest) => guest.code === code)) { index -= 1; continue; }
    const response = await page.request.get(`/api/links/guest/${code}`, { headers: { 'x-forwarded-for': `198.51.100.${(index % 250) + 1}` } });
    expect(response.status()).toBe(404);
  }
});

test('injection strings render as text, oversized API input is rejected, and session risk is documented', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'security payload checks run once');
  test.setTimeout(120_000);
  await loginAsDemo(page);
  const xss = '<script>alert(1)</script>';
  const guestResponse = await page.request.post('/api/invitations/inv-001/guests', {
    data: { input: { name: xss, phone: '94770001001' } },
  });
  expect(guestResponse.status()).toBe(201);
  const guest = await guestResponse.json() as { id: string; code: string; name: string };
  await page.addInitScript(() => {
    (window as Window & { __xss?: boolean }).__xss = false;
    window.alert = () => { (window as Window & { __xss?: boolean }).__xss = true; };
  });
  await page.goto(`/s/${guest.code}`);
  await expect(page.getByText(xss, { exact: true })).toBeVisible();
  await expect(page.evaluate(() => (window as Window & { __xss?: boolean }).__xss)).resolves.toBe(false);

  const tooLongGuest = await page.request.post('/api/invitations/inv-001/guests', { data: { input: { name: 'N'.repeat(10_000), phone: '94770001002' } } });
  expect(tooLongGuest.status()).toBe(400);
  const oversizedMessage = await page.request.post('/api/guests/guest-001/rsvp', { data: { rsvpStatus: 'attending', partySize: 1, rsvpMessage: 'M'.repeat(10_000) } });
  expect(oversizedMessage.status()).toBe(400);
  expect(oversizedMessage.headers()['content-type']).toContain('application/json');
  const oversizedEditorMessage = await page.request.patch('/api/invitations/inv-001', {
    data: { customData: { hostNames: 'A & B', eventTitle: 'Event', date: '2027-01-01', time: '12:00', venue: 'Hall', message: 'M'.repeat(10_000), colors: { primary: '#111111', secondary: '#ffffff', accent: '#333333' } } },
  });
  expect(oversizedEditorMessage.status()).toBe(400);
  const malformedBatch = await page.request.post('/api/invitations/inv-001/guests', { data: { inputs: 'not-an-array' } });
  expect(malformedBatch.status()).toBe(400);

  const cookieContext = await browser.newContext();
  const cookiePage = await cookieContext.newPage();
  await loginAsDemo(cookiePage);
  const sessionCookie = (await cookieContext.cookies()).find((cookie) => cookie.name === 'auth_user');
  expect(sessionCookie).toBeTruthy();
  expect(sessionCookie?.httpOnly).toBe(false);
  expect(sessionCookie?.sameSite).toBe('Lax');
  await expect(cookiePage.evaluate(() => document.cookie)).resolves.toContain('auth_user=');
  testInfo.annotations.push({ type: 'security TODO', description: 'Mock auth cookie is JavaScript-readable and has no HttpOnly/Secure flag; replace with server-managed production auth.' });
  await cookieContext.close();
});
