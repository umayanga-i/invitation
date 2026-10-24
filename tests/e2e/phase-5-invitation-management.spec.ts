import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('management KPIs, search and RSVP filters match the seeded guest data', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'management layout is exercised at mobile and desktop breakpoints');
  await loginAsDemo(page);
  await page.goto('/invitations/inv-001');
  const kpis: Record<string, string> = {
    Invited: '12', Opened: '10', Attending: '4', 'Not attending': '2', Maybe: '2', 'No reply': '4', 'Total headcount': '10',
  };
  const kpiCards = page.locator('section.mt-8 > div.grid').first().locator('article');
  for (const [label, value] of Object.entries(kpis)) {
    const card = kpiCards.filter({ has: page.getByText(label, { exact: true }) });
    await expect(card).toContainText(value);
  }

  if (testInfo.project.name === 'desktop') {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('table').getByRole('columnheader')).toHaveCount(8);
  } else {
    const firstGuestCard = page.locator('div.md\\:hidden article').first();
    await expect(firstGuestCard).toBeVisible();
    await expect(firstGuestCard.getByText('Party size', { exact: true })).toBeVisible();
  }

  const search = page.getByRole('searchbox', { name: 'Search guests by name' });
  const filter = page.getByLabel('Filter guests by RSVP status');
  const matchingGuest = testInfo.project.name === 'desktop'
    ? page.getByRole('table').getByText('Kumari Perera', { exact: true })
    : page.locator('div.md\\:hidden article').getByText('Kumari Perera', { exact: true });
  await search.fill('Kumari');
  await expect(matchingGuest).toBeVisible();
  await expect(page.getByText('Suresh Jayawardena', { exact: true })).toHaveCount(0);
  await filter.selectOption('attending');
  await expect(matchingGuest).toBeVisible();
  await filter.selectOption('maybe');
  const noMatches = testInfo.project.name === 'desktop'
    ? page.locator('p:visible').filter({ hasText: 'No guests match this search.' })
    : page.locator('div.md\\:hidden').getByText('No guests match this search.');
  await expect(noMatches).toBeVisible();
  await search.fill('');
  for (const [value, visibleName] of [['all', 'Kumari Perera'], ['pending', 'Chamindra Silva'], ['attending', 'Nirosha Fernando'], ['not_attending', 'Rajiv Balasuriya'], ['maybe', 'Dilani Ranasinghe']]) {
    await filter.selectOption(value);
    const visibleGuest = testInfo.project.name === 'desktop'
      ? page.getByRole('table').getByText(visibleName, { exact: true })
      : page.locator('div.md\\:hidden article').getByText(visibleName, { exact: true });
    await expect(visibleGuest).toBeVisible();
  }
});

test('guest edits validate and save; confirmed deletion updates the tracker', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'mobile and desktop layouts are covered');
  await loginAsDemo(page);
  await page.goto('/invitations/inv-001');
  const guestRow = testInfo.project.name === 'desktop'
    ? page.getByRole('row').filter({ hasText: 'Kumari Perera' })
    : page.locator('div.md\\:hidden article').filter({ hasText: 'Kumari Perera' });
  await guestRow.getByRole('button', { name: 'Edit', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit guest' });
  await dialog.getByLabel('Phone').fill('123');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'valid Sri Lankan mobile number' })).toBeVisible();
  await dialog.getByLabel('Name').fill('Kumari Updated');
  await dialog.getByLabel('Phone').fill('0771234567');
  await dialog.getByLabel('Email (optional)').fill('kumari.updated@example.com');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  const updatedRow = testInfo.project.name === 'desktop'
    ? page.getByRole('row').filter({ hasText: 'Kumari Updated' })
    : page.locator('div.md\\:hidden article').filter({ hasText: 'Kumari Updated' });
  await expect(updatedRow).toContainText('94771234567');
  const savedGuests = await (await page.request.get('/api/invitations/inv-001/guests')).json() as Array<{ name: string; phone: string; email?: string }>;
  expect(savedGuests.find((guest) => guest.name === 'Kumari Updated')).toMatchObject({ phone: '94771234567', email: 'kumari.updated@example.com' });

  page.once('dialog', (dialogEvent) => dialogEvent.accept());
  await updatedRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Kumari Updated', { exact: true })).toHaveCount(0);
  await expect(page.locator('section.mt-8 > div.grid').first().locator('article').filter({ has: page.getByText('Invited', { exact: true }) })).toContainText('11');
});

test('invitation list supports edit, duplicate, publish, unpublish and confirmed delete; unknown IDs are friendly', async ({ page }) => {
  await loginAsDemo(page);
  await page.goto('/invitations');
  const summit = page.locator('article').filter({ hasText: 'Annual Digital Summit 2027' });
  await summit.getByRole('button', { name: 'Publish' }).click();
  await expect(summit.getByText('Published')).toBeVisible();
  await summit.getByRole('button', { name: 'Unpublish' }).click();
  await expect(summit.getByText('Draft')).toBeVisible();
  await summit.getByRole('link', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit invitation' })).toBeVisible();
  await page.goto('/invitations');

  const birthday = page.locator('article').filter({ hasText: "Nimal's 50th Birthday Bash" });
  await birthday.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.getByRole('status')).toContainText('Invitation duplicated');
  const duplicate = page.locator('article').filter({ hasText: "Nimal's 50th Birthday Bash (copy)" });
  await expect(duplicate).toContainText('0 guests');
  page.once('dialog', (dialogEvent) => dialogEvent.accept());
  await duplicate.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText("Nimal's 50th Birthday Bash (copy)", { exact: true })).toHaveCount(0);

  await page.goto('/invitations/inv-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Invitation not found' })).toBeVisible();
});
