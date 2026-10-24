import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { Invitation } from '@/lib/mock-data';
import { loginAsDemo } from './helpers';

test.use({ actionTimeout: 15_000 });

test('keepsake envelope, local assets, photo editing and guest responses work together', async ({ page, browser }, testInfo) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await loginAsDemo(page);
  await page.goto('/templates/wedding-keepsake');
  await expect(page.getByLabel('Host name(s)')).toHaveValue('Nimesh & Dilhani');
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2026-12-27');
  await expect(page.getByLabel('First partner’s parents')).toHaveValue('Mr. & Mrs. Sunil Perera');
  await expect(page.getByLabel('Event 3 time')).toHaveValue('18:30');
  const preview = page.getByLabel('Live invitation preview');
  await expect(preview.getByRole('button', { name: /^Add .*photo/ })).toHaveCount(8);
  await preview.getByRole('button', { name: 'Preview envelope' }).click();
  await expect(page.getByRole('dialog', { name: 'Wedding envelope' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open invitation', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Wedding envelope' })).toHaveCount(0);
  await expect(preview.getByRole('button', { name: 'Preview envelope' })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

  const image = path.resolve('public/images/templates/wedding-ivory/couple-hero.webp');
  const story = path.resolve('public/images/templates/wedding-ivory/story.webp');
  for (const [label, file] of [['couple', image], ['story', story], ...Array.from({ length: 6 }, (_, index) => [`gallery ${index + 1}`, index % 2 ? story : image])] as const) {
    const inputLabel = label.startsWith('gallery') ? `Choose gallery photo ${label.split(' ')[1]}` : `Choose ${label} photo`;
    await preview.getByLabel(inputLabel, { exact: true }).setInputFiles(file);
    await expect(preview.locator('[role="status"]')).toHaveCount(0);
  }
  await expect(preview.getByRole('button', { name: /^Replace .*photo/ })).toHaveCount(8);
  await page.getByLabel('Host name(s)').fill('Asha & Nimal');
  await page.getByLabel('Event title', { exact: true }).fill('Keepsake Photo Test');
  await page.getByLabel('Date', { exact: true }).fill('2029-12-27');
  await page.getByLabel('RSVP deadline (optional)').fill('2029-12-10');
  await page.getByLabel('Story heading').fill('Our beautiful beginning');
  await page.getByLabel('Our story').fill('A story and eight photos to remember.');
  const creation = page.waitForResponse((response) => response.url().endsWith('/api/invitations') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save invitation', exact: true }).click();
  const response = await creation;
  expect(response.status()).toBe(201);
  const invitation = await response.json() as Invitation;
  const guestContext = await browser.newContext({ viewport: testInfo.project.use.viewport, reducedMotion: testInfo.project.name === 'desktop' ? 'no-preference' : 'reduce' });
  const guestPage = await guestContext.newPage();
  const externalRequests: string[] = [];
  guestPage.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname)) externalRequests.push(request.url());
  });
  await guestPage.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['http:', 'https:'].includes(url.protocol) && !['localhost', '127.0.0.1'].includes(url.hostname) ? route.abort() : route.continue();
  });
  guestPage.on('pageerror', (error) => errors.push(error.message));
  guestPage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    expect(Object.keys(invitation.customData.photos!)).toHaveLength(8);
    expect(invitation.customData.weddingDetails?.storyTitle).toBe('Our beautiful beginning');
    expect((await page.request.patch(`/api/invitations/${invitation.id}`, { data: { status: 'published' } })).ok()).toBeTruthy();
    const manifest = await (await guestPage.request.get('/assets/templates/golden-keepsake/asset-manifest.json')).json() as { files: Array<{ file: string }> };
    expect(manifest.files).toHaveLength(7);
    for (const asset of [...manifest.files.map((file) => file.file), 'fonts.css', 'cover.svg']) {
      expect((await guestPage.request.get(`/assets/templates/golden-keepsake/${asset}`)).ok()).toBeTruthy();
    }
    const fontCss = await (await guestPage.request.get('/assets/templates/golden-keepsake/fonts.css')).text();
    expect(fontCss).not.toMatch(/url\(https?:/);
    await guestPage.goto(`/i/${invitation.slug}`);
    const envelope = guestPage.getByRole('dialog', { name: 'Wedding envelope' });
    await expect(envelope).toBeVisible();
    await guestPage.evaluate(() => document.fonts.load('400 20px "Cormorant Infant"'));
    await expect(guestPage.getByRole('button', { name: 'Open invitation', exact: true })).toBeFocused();
    await guestPage.screenshot({ path: testInfo.outputPath('keepsake-envelope.png') });
    await guestPage.getByRole('button', { name: 'Open invitation', exact: true }).click();
    if (testInfo.project.name === 'desktop') await expect(envelope).toHaveAttribute('data-phase', 'opening');
    await expect(envelope).toHaveCount(0);
    await expect(guestPage.locator('[data-section="hero"]')).toBeFocused();
    expect(await guestPage.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    await expect(guestPage.locator('[data-section="hero"]')).toContainText('Nimal');
    await expect(guestPage.locator('[data-section="story"]')).toContainText('Our beautiful beginning');
    await expect(guestPage.getByRole('button', { name: /(?:Add|Replace|Remove).*photo/ })).toHaveCount(0);
    await expect(guestPage.locator('input[type=file]')).toHaveCount(0);
    await expect(guestPage.locator('[data-photo-slot] img')).toHaveCount(8);
    expect(await guestPage.locator('a[href]').evaluateAll((links) => links.some((link) => /invitation[.]lk/i.test((link as HTMLAnchorElement).href)))).toBeFalsy();
    expect(await guestPage.locator('body').innerText()).not.toMatch(/invitation[.]lk/i);
    await guestPage.getByRole('img', { name: 'Story photo', exact: true }).scrollIntoViewIfNeeded();
    await guestPage.getByRole('img', { name: 'Gallery photo 6', exact: true }).scrollIntoViewIfNeeded();
    expect(await guestPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await guestPage.evaluate(() => Array.from(document.fonts).some((font) => font.family.includes('Cormorant Infant') && font.status === 'loaded'))).toBeTruthy();
    await guestPage.screenshot({ path: testInfo.outputPath('keepsake-invitation.png'), fullPage: true });
    await guestPage.getByLabel('Your name', { exact: true }).fill('Keepsake Guest');
    await guestPage.getByRole('button', { name: 'Send RSVP', exact: true }).click();
    await expect(guestPage.getByRole('status')).toContainText('Your response is saved');
    await page.waitForURL(`**/invitations/${invitation.id}`);
    await page.goto(`/invitations/${invitation.id}/edit`);
    await expect(page.getByLabel('Live invitation preview').getByRole('button', { name: /^Replace .*photo/ })).toHaveCount(8);
    await page.getByLabel('Live invitation preview').getByRole('button', { name: 'Remove gallery photo 6', exact: true }).click();
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.waitForURL(`**/invitations/${invitation.id}`);
    await guestPage.reload();
    await guestPage.getByRole('button', { name: 'Open invitation', exact: true }).click();
    await expect(guestPage.getByRole('dialog', { name: 'Wedding envelope' })).toHaveCount(0);
    await expect(guestPage.locator('[data-section="gallery"] img')).toHaveCount(5);
    expect(externalRequests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    try {
      await guestContext.close();
    } finally {
      await page.request.delete(`/api/invitations/${invitation.id}`);
    }
  }
});
