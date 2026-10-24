import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('dashboard navigation, search, invitation cards, category rows, and responsive width', async ({ page }, testInfo) => {
  await loginAsDemo(page);
  await expect(page.getByRole('link', { name: 'Invitation Studio — home' })).toBeVisible();
  await expect(page.getByPlaceholder('Search templates…')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My invitations' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open user menu' })).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open mobile menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  }

  const search = page.getByPlaceholder('Search templates…');
  await search.fill('wedding');
  await expect(page.getByRole('link', { name: /Use the .* template/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Use the .* template/ })).toHaveCount(3);
  await search.fill('no-such-template');
  await expect(page.getByText(/No templates match/)).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByRole('link', { name: /Use the .* template/ })).toHaveCount(18);

  const invitationLinks = page.locator('section[aria-label="My invitations"] a[aria-label^="Open invitation:"]');
  const count = await invitationLinks.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const link = invitationLinks.nth(index);
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/invitations\/inv-/);
    if (index === 0) {
      await link.focus();
      await page.keyboard.press('Enter');
    } else {
      await link.click();
    }
    await expect(page).toHaveURL(new RegExp(href!.replaceAll('/', '\\/')));
    await expect(page.getByRole('heading', { name: 'Invitation preview' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'My invitations' })).toBeVisible();
  }

  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole('link', { name: '＋ Create invitation' })).toHaveAttribute('href', '/templates/wedding-classic');
  await expect(page.getByRole('link', { name: 'Browse templates' })).toHaveAttribute('href', '/#templates');

  if (testInfo.project.name === 'desktop') {
    const row = page.getByRole('region', { name: 'Weddings templates' }).locator('[role="list"]').first();
    const before = await row.evaluate((element) => element.scrollLeft);
    const arrow = page.getByRole('button', { name: 'Scroll Weddings right' });
    const canScroll = await row.evaluate((element) => element.scrollWidth > element.clientWidth);
    if (canScroll) {
      await arrow.click();
      await expect.poll(() => row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
    }
    const after = await row.evaluate((element) => element.scrollLeft);
    expect(after).toBeGreaterThanOrEqual(before);
    await page.getByRole('link', { name: /Use the .* template/ }).first().hover();
    await expect(page.getByRole('link', { name: /Use the .* template/ }).first().getByText('Use this template →')).toBeVisible();
  }
});
