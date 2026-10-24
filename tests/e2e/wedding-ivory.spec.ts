import { expect, test } from '@playwright/test';
import { loginAsDemo } from './helpers';

test.use({ actionTimeout: 15_000 });
// Keep this journey isolated: create and delete its own invitation without resetting the user's data.
test('ivory wedding template edits, opens its envelope and persists guest replies', async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loginAsDemo(page);
  await expect(page.getByRole('link', { name: 'Use the Ivory & Gold template' })).toBeVisible();
  await page.goto('/templates/wedding-ivory');
  const preview = page.getByLabel('Live invitation preview');
  await expect(preview.getByRole('heading', { level: 1 })).toContainText('Hiruni');
  await expect(page.getByRole('dialog', { name: 'Wedding invitation' })).toHaveCount(0);
  await page.getByLabel('Host name(s)').fill('Asha & Kavi');
  await page.getByLabel('Event title', { exact: true }).fill('Ivory Wedding Test');
  await page.getByLabel('Date', { exact: true }).fill('2029-01-23');
  await page.getByLabel('Time', { exact: true }).fill('10:30');
  await page.getByLabel('Venue', { exact: true }).fill('Galle Fort');
  await page.getByLabel('Message').fill('Our story begins with you. සිංහල தமிழ்');
  await page.getByLabel('primary', { exact: true }).fill('#463e36');
  await expect(preview.getByRole('heading', { level: 1 })).toContainText('Asha');
  await expect(preview.getByRole('heading', { level: 1 })).toHaveCSS('color', 'rgb(70, 62, 54)');
  const creation = page.waitForResponse((response) => response.url().endsWith('/api/invitations') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save invitation', exact: true }).click();
  const response = await creation;
  expect(response.status()).toBe(201);
  const invitation = await response.json() as { id: string; slug: string };
  const guestContext = await browser.newContext({ viewport: testInfo.project.use.viewport, reducedMotion: 'reduce' });
  const guestPage = await guestContext.newPage();
  guestPage.on('pageerror', (error) => errors.push(error.message));
  try {
    expect((await page.request.patch(`/api/invitations/${invitation.id}`, { data: { status: 'published' } })).ok()).toBeTruthy();
    for (const image of ['backdrop-mobile', 'countdown-floral', 'couple-hero', 'envelope-closed', 'footer-floral', 'story']) {
      const asset = await guestPage.request.get(`/images/templates/wedding-ivory/${image}.webp`);
      expect(asset.ok()).toBeTruthy();
      expect(asset.headers()['content-type']).toContain('image/webp');
    }
    await guestPage.goto(`/i/${invitation.slug}`);
    const envelope = guestPage.getByRole('dialog', { name: 'Wedding invitation' });
    await expect(envelope).toBeVisible();
    await expect(guestPage.getByRole('button', { name: 'Tap to open' })).toBeFocused();
    expect(await guestPage.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await guestPage.screenshot({ path: testInfo.outputPath('envelope.png') });
    await guestPage.getByRole('button', { name: 'Tap to open' }).click();
    await expect(envelope).toHaveCount(0);
    expect(await guestPage.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    await expect(guestPage.locator('[data-section="hero"]')).toBeFocused();
    await expect(guestPage.locator('[data-section="hero"] h1')).toContainText('Kavi');
    await expect.poll(() => guestPage.locator('[data-section="hero"] img').evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(guestPage.locator('[data-section="story"]')).toContainText('Our story begins with you. සිංහල தமிழ்');
    await expect(guestPage.getByRole('link', { name: 'Save our date' })).toHaveAttribute('href', /20290123T050000Z/);
    await expect(guestPage.getByRole('link', { name: 'Open in Maps' })).toHaveAttribute('href', /Galle%20Fort/);
    await expect(guestPage.getByLabel('Wedding countdown')).not.toContainText('—');
    const dimensions = await guestPage.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    await guestPage.screenshot({ path: testInfo.outputPath('invitation.png'), fullPage: true });
    await guestPage.getByLabel('Your name', { exact: true }).fill('Ivory Template Guest');
    await guestPage.getByLabel('Party size').selectOption('2');
    await guestPage.getByRole('button', { name: 'Send RSVP', exact: true }).click();
    await expect(guestPage.getByRole('status')).toContainText('Your response is saved');
    const guests = await (await page.request.get(`/api/invitations/${invitation.id}/guests`)).json() as Array<{ name: string; partySize: number; rsvpStatus: string }>;
    expect(guests.find((guest) => guest.name === 'Ivory Template Guest')).toMatchObject({ partySize: 2, rsvpStatus: 'attending' });
    await guestPage.getByRole('button', { name: 'Change my answer' }).click();
    await guestPage.getByRole('radio', { name: 'Not attending', exact: true }).check();
    await guestPage.getByRole('button', { name: 'Update my RSVP', exact: true }).click();
    await expect(guestPage.getByRole('status')).toContainText('Not attending');
    expect(errors).toEqual([]);
  } finally {
    await guestContext.close();
    await page.request.delete(`/api/invitations/${invitation.id}`);
  }
});
