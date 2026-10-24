import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('common invitation works in an unauthenticated mobile profile and stores the RSVP for the host', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'guest journey is tested on the required mobile viewport');
  await loginAsDemo(page);
  const guestContext = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  const guestPage = await guestContext.newPage();
  const errors: string[] = [];
  guestPage.on('pageerror', (error) => errors.push(error.message));
  guestPage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  expect((await guestContext.storageState()).cookies).toHaveLength(0);
  const commonInvitation = await (await page.request.get('/api/invitations/inv-002')).json() as { slug: string };
  await guestPage.goto(`/i/${commonInvitation.slug}`);
  await expect(guestPage.getByRole('heading', { name: "Nimal's 50th Birthday Bash" }).first()).toBeVisible();
  await expect(guestPage.locator('meta[property="og:title"]')).toHaveAttribute('content', "Nimal's 50th Birthday Bash");
  const name = guestPage.getByLabel('Your name');
  await guestPage.getByRole('button', { name: 'Send RSVP' }).click();
  await expect(name).toHaveJSProperty('validity.valueMissing', true);
  await name.fill('Common Link Guest');
  await guestPage.getByLabel('Party size').selectOption('3');
  await guestPage.getByLabel('Message (optional)').fill('See you soon!');
  await guestPage.getByRole('button', { name: 'Send RSVP' }).click();
  await expect(guestPage.getByRole('status')).toContainText('Your response is saved');
  await expect(guestPage.getByRole('button', { name: 'Change my answer' })).toBeVisible();
  expect(errors).toEqual([]);

  const invalidResponse = await guestPage.request.post('/api/invitations/inv-002/rsvps', { data: { name: 'No Response' } });
  expect(invalidResponse.status()).toBe(400);
  await page.goto('/invitations/inv-002');
  const guestsResponse = await page.request.get('/api/invitations/inv-002/guests');
  const guests = await guestsResponse.json() as Array<{ name: string; rsvpStatus: string; partySize?: number; rsvpMessage?: string }>;
  expect(guests.find((item) => item.name === 'Common Link Guest')).toMatchObject({ rsvpStatus: 'attending', partySize: 3, rsvpMessage: 'See you soon!' });
  await guestContext.close();
});

test('personal invitation locks the guest name, records first open once, and supports changing the answer', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'guest journey is tested on the required mobile viewport');
  await loginAsDemo(page);
  const createdResponse = await page.request.post('/api/invitations/inv-001/guests', { data: { input: { name: 'Nadeesha Perera', phone: '94770001001' } } });
  expect(createdResponse.status()).toBe(201);
  const created = await createdResponse.json() as { id: string; code: string; openedAt?: string };
  expect(created.openedAt).toBeFalsy();

  const guestContext = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  const guestPage = await guestContext.newPage();
  const errors: string[] = [];
  guestPage.on('pageerror', (error) => errors.push(error.message));
  guestPage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  expect((await guestContext.storageState()).cookies).toHaveLength(0);
  await guestPage.goto(`/s/${created.code}`);
  await expect(guestPage.getByText('Dear Nadeesha Perera,', { exact: true })).toBeVisible();
  await expect(guestPage.getByLabel('Your name')).toHaveCount(0);
  await expect(guestPage.getByText('Nadeesha Perera', { exact: true }).first()).toBeVisible();
  const guestList = async () => await (await page.request.get('/api/invitations/inv-001/guests')).json() as Array<{ id: string; openedAt?: string; respondedAt?: string; rsvpStatus: string; partySize?: number; rsvpMessage?: string }>;
  const firstOpenedAt = (await guestList()).find((guest) => guest.id === created.id)?.openedAt;
  expect(firstOpenedAt).toBeTruthy();
  await guestPage.getByLabel('Party size').selectOption('2');
  await guestPage.getByLabel('Message (optional)').fill('We will be there.');
  await guestPage.getByRole('button', { name: 'Update my RSVP' }).click();
  await expect(guestPage.getByRole('status')).toContainText('Your response is saved');
  await expect(guestPage.getByRole('status')).toContainText('Nadeesha Perera');
  await guestPage.reload();
  await expect(guestPage.getByRole('button', { name: 'Change my answer' })).toBeVisible();
  await guestPage.getByRole('button', { name: 'Change my answer' }).click();
  await guestPage.getByLabel('Maybe').check();
  await guestPage.getByLabel('Message (optional)').fill('Plans changed.');
  await guestPage.getByRole('button', { name: 'Update my RSVP' }).click();
  await expect(guestPage.getByRole('status')).toContainText('Maybe');
  const finalGuest = (await guestList()).find((guest) => guest.id === created.id)!;
  expect(finalGuest).toMatchObject({ rsvpStatus: 'maybe', partySize: 0, rsvpMessage: 'Plans changed.' });
  expect(finalGuest.respondedAt).toBeTruthy();
  expect(finalGuest.openedAt).toBe(firstOpenedAt);
  await page.goto('/invitations/inv-001');
  await expect(page.locator('section.mt-8 > div.grid').first().locator('article').filter({ has: page.getByText('Opened', { exact: true }) })).toContainText('11');
  expect(errors).toEqual([]);
  await guestContext.close();
});

test('public links handle revoked, unknown, malformed and long codes; enforce deadline and max party size', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'public guest links are tested on the required mobile viewport');
  await loginAsDemo(page);
  const guestResponse = await page.request.get('/api/invitations/inv-001/guests');
  const seedGuests = await guestResponse.json() as Array<{ id: string; code: string }>;
  const revokedGuest = seedGuests[0];
  const revokeResponse = await page.request.patch(`/api/guests/${revokedGuest.id}`, { data: { revoked: true } });
  expect(revokeResponse.ok()).toBeTruthy();

  const deadline = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const originalInvitation = await (await page.request.get('/api/invitations/inv-002')).json() as { customData: Record<string, unknown> };
  const patchedInvitation = await page.request.patch('/api/invitations/inv-002', { data: { customData: { ...originalInvitation.customData, rsvpDeadline: deadline, maxPartySize: 2 } } });
  expect(patchedInvitation.ok()).toBeTruthy();
  const commonInvitation = await (await page.request.get('/api/invitations/inv-002')).json() as { slug: string };
  const guestContext = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  const guestPage = await guestContext.newPage();
  const errors: string[] = [];
  guestPage.on('pageerror', (error) => errors.push(error.message));
  guestPage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const url of [`/s/${revokedGuest.code}`, '/s/unknowncode', '/s/%25%25%25', `/s/${'x'.repeat(400)}`]) {
    await guestPage.goto(url);
    await expect(guestPage.getByRole('heading', { name: 'Invitation not available' })).toBeVisible();
    await expect(guestPage.locator('body')).not.toContainText(/Error:|stack trace|guest-00\d/);
  }
  await guestPage.goto(`/i/${commonInvitation.slug}`);
  await expect(guestPage.getByRole('status')).toContainText('RSVP closed');
  const openForPartyCheck = await page.request.patch('/api/invitations/inv-002', { data: { customData: { ...originalInvitation.customData, rsvpDeadline: '', maxPartySize: 2 } } });
  expect(openForPartyCheck.ok()).toBeTruthy();
  const tooMany = await guestPage.request.post('/api/invitations/inv-002/rsvps', { data: { name: 'Too Many', rsvpStatus: 'attending', partySize: 3 } });
  expect(tooMany.status()).toBe(400);
  expect((await tooMany.json()).error).toContain('between 1 and 2');
  expect(errors).toEqual([]);
  await guestContext.close();
});

test('rapid RSVP submissions are throttled with a clear error response', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'rate-limit stress runs once');
  const responses: number[] = [];
  for (let requestIndex = 0; requestIndex < 30; requestIndex += 1) {
    const response = await page.request.post('/api/guests/guest-001/rsvp', {
      headers: { 'x-forwarded-for': '198.51.100.220' },
      data: { rsvpStatus: 'attending', partySize: 1, rsvpMessage: `Rapid ${requestIndex}` },
    });
    responses.push(response.status());
  }
  expect(responses.some((status) => status === 429)).toBe(true);
  const limitedResponse = await page.request.post('/api/guests/guest-001/rsvp', {
    headers: { 'x-forwarded-for': '198.51.100.220' }, data: { rsvpStatus: 'attending', partySize: 1 },
  });
  expect(limitedResponse.status()).toBe(429);
  expect((await limitedResponse.json()).error).toContain('Too many requests');
});
