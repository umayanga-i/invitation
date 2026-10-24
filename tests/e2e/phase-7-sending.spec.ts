import { expect, test } from './fixtures';
import { loginAsDemo, resetMockData } from './helpers';

test('WhatsApp URL, clipboard, revoked links, sending queues and email placeholder', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'sending controls are exercised once on desktop');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    window.open = (() => {
      const location = { set href(value: string) { window.localStorage.setItem('__qa_wa_target', value); } };
      return { opener: null, location } as unknown as Window;
    }) as typeof window.open;
  });
  // Phase 6 intentionally creates hundreds of guests; make the queue assertion
  // independent of whether the dev server reused the same SQLite worker.
  await resetMockData(page);
  await loginAsDemo(page);
  await page.goto('/invitations/inv-001');

  const listResponse = await page.request.get('/api/invitations/inv-001/guests');
  const guests = await listResponse.json() as Array<{ id: string; name: string; phone: string; code: string; rsvpStatus: string }>;
  const kumari = guests.find((guest) => guest.name === 'Kumari Perera')!;
  const kumariRow = page.getByRole('row').filter({ hasText: kumari.name });
  await kumariRow.getByRole('button', { name: 'WhatsApp', exact: true }).click();
  const waUrl = await page.evaluate(() => window.localStorage.getItem('__qa_wa_target'));
  expect(waUrl).toBeTruthy();
  const parsedWa = new URL(waUrl!);
  expect(parsedWa.origin + parsedWa.pathname).toBe(`https://wa.me/${kumari.phone.replace(/\D/g, '')}`);
  const waMessage = parsedWa.searchParams.get('text')!;
  expect(waMessage).toContain(kumari.name);
  expect(waMessage).toContain(`/s/${kumari.code}`);
  expect(waMessage).toContain("Amaya & Dilan's Wedding");
  expect(parsedWa.search).toContain('%26');

  await kumariRow.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(`Personal link copied for ${kumari.name}`);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:3000/s/${kumari.code}`);
  await expect(kumariRow.getByRole('button', { name: 'Email · Coming soon' })).toBeDisabled();

  await kumariRow.getByRole('button', { name: 'Revoke link', exact: true }).click();
  await expect(kumariRow.getByText('Link revoked', { exact: true })).toBeVisible();
  const guestContext = await page.context().browser()!.newContext({ viewport: { width: 360, height: 800 } });
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/s/${kumari.code}`);
  await expect(guestPage.getByRole('heading', { name: 'Invitation not available' })).toBeVisible();
  await guestContext.close();

  await page.getByRole('button', { name: 'Send to all' }).click();
  const queue = page.getByRole('dialog', { name: /Send invitations/ });
  await expect(queue).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByText(/Send invitations · 1 of 11/)).toBeVisible();
  for (let guestIndex = 1; guestIndex < 11; guestIndex += 1) {
    await expect(queue.getByText(kumari.name, { exact: true })).toHaveCount(0);
    await queue.getByRole('button', { name: 'Next guest →' }).click();
    await expect(page.getByText(`Send invitations · ${guestIndex + 1} of 11`)).toBeVisible();
  }
  await queue.getByRole('button', { name: 'Finish' }).click();
  await expect(queue).toHaveCount(0);

  await page.getByRole('button', { name: 'Send reminder' }).click();
  await expect(page.getByText('Send invitations · 1 of 4')).toBeVisible();
  const reminder = page.getByRole('dialog', { name: /Send invitations/ });
  const reminderGuest = await reminder.locator('p.text-sm.text-gray-600').innerText();
  expect(guests.find((guest) => guest.name === reminderGuest)?.rsvpStatus).toBe('pending');
});

test('unpublished invitations cannot share guest links until published', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'draft publish flow is exercised once');
  await loginAsDemo(page);
  await page.goto('/invitations/inv-003');
  await expect(page.getByText('This invitation is a draft')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send to all' })).toBeDisabled();
  await page.getByRole('button', { name: 'Publish invitation' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Invitation published' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send to all' })).toBeEnabled();
});
