import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test.setTimeout(90_000);

const navigation = [
  { text: 'Dashboard', href: '/dashboard' },
  { text: 'Templates', href: '/dashboard#templates' },
  { text: 'My invitations', href: '/invitations' },
];

async function assertHeader(page: Page, mobile: boolean) {
  const header = page.locator('[data-app-header]');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(header).toBeVisible();
  await expect(header).toHaveCSS('height', '64px');
  await expect(header).toHaveCSS('position', 'sticky');
  await expect(header).toHaveCSS('background-color', 'rgb(74, 11, 21)');
  expect((await header.boundingBox())?.y).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (mobile) await header.getByRole('button', { name: 'Open menu', exact: true }).click();
  const nav = page.getByRole('navigation', { name: mobile ? 'Mobile main' : 'Main', exact: true });
  await expect(nav).toBeVisible();
  expect(await nav.locator('a').evaluateAll((anchors) => anchors.map((anchor) => ({ text: anchor.textContent, href: anchor.getAttribute('href') })))).toEqual(navigation);
  if (mobile) await page.getByRole('button', { name: 'Close menu', exact: true }).click();
}

test('one identical header on every signed-in page, with server-rendered session and guest exclusions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'desktop and 360px cover the two header designs');
  const mobile = testInfo.project.name === 'mobile';
  await loginAsDemo(page);
  const routes = ['/', '/dashboard', '/invitations', '/invitations/inv-001', '/invitations/inv-001/edit', '/templates/wedding-classic', '/profile', '/terms', '/privacy'];
  for (const route of routes) {
    await page.goto(route);
    await assertHeader(page, mobile);
    await expect(page.getByText(/Test credentials/)).toHaveCount(0);
    const response = await page.request.get(route);
    const html = await response.text();
    expect((html.match(/<header\b/g) ?? []).length, `server-rendered header on ${route}`).toBe(1);
    expect(html).toContain('data-app-header');
    if (route === '/') await expect(page.locator('.iv-hero')).toHaveCSS('height', `${testInfo.project.use.viewport!.height - 64}px`);
    if (route === '/' || route === '/templates/wedding-classic') await page.screenshot({ path: testInfo.outputPath(route === '/' ? 'landing.png' : 'editor.png') });
    if (route.startsWith('/invitations')) await expect(page.locator('.iv-app-desktop-nav [aria-current="page"]')).toHaveText('My invitations');
    if (route.startsWith('/templates')) await expect(page.locator('.iv-app-desktop-nav [aria-current="page"]')).toHaveText('Templates');
  }

  const legalHeader = await page.locator('[data-app-header]').elementHandle();
  await page.getByRole('link', { name: 'Back to Invitely ↗', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('navigation', { name: 'Footer', exact: true }).getByRole('link', { name: 'Terms', exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  expect(await legalHeader!.evaluate((element) => element.isConnected && element === document.querySelector('[data-app-header]'))).toBe(true);

  const invitation = await (await page.request.get('/api/invitations/inv-001')).json() as { slug: string };
  const guests = await (await page.request.get('/api/invitations/inv-001/guests')).json() as { code: string }[];
  for (const route of [`/i/${invitation.slug}`, `/s/${guests[0].code}`, '/forgot-password']) {
    await page.goto(route);
    await expect(page.locator('[data-app-header]')).toHaveCount(0);
    if (route !== '/forgot-password') await expect(page.getByText('Invitation not available', { exact: true })).toHaveCount(0);
  }
});

test('header survives navigation; search, account keyboard controls, and mobile focus work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'desktop and 360px cover the two header designs');
  const mobile = testInfo.project.name === 'mobile';
  await loginAsDemo(page);
  const header = await page.locator('[data-app-header]').elementHandle();
  expect(header).not.toBeNull();
  if (mobile) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Main menu', exact: true });
    await expect(menu).toHaveCSS('height', '800px');
    await expect(menu.getByText('Demo User', { exact: true })).toBeVisible();
    await expect(menu.getByText('demo@invite.test', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(menu.getByRole('button', { name: 'Sign out', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  }
  await page.getByRole('navigation', { name: mobile ? 'Mobile main' : 'Main', exact: true }).getByRole('link', { name: 'My invitations', exact: true }).click();
  await expect(page).toHaveURL(/\/invitations$/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(await header!.evaluate((element) => element.isConnected && element === document.querySelector('[data-app-header]'))).toBe(true);

  const avatar = page.getByRole('button', { name: 'Open user menu', exact: true });
  await avatar.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Profile', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Sign out', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(avatar).toBeFocused();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await avatar.click();
  await page.getByRole('menuitem', { name: 'Profile', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  expect(await header!.evaluate((element) => element.isConnected)).toBe(true);

  if (mobile) await page.getByRole('button', { name: 'Open search', exact: true }).click();
  const search = page.getByRole('search', { name: 'Search templates', exact: true });
  await search.getByRole('searchbox').fill('no-such-template');
  await search.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/\/dashboard\?q=no-such-template$/);
  await expect(page.getByText('No templates match “no-such-template”. Try another search.')).toBeVisible();
  expect(await header!.evaluate((element) => element.isConnected)).toBe(true);
  if (mobile) await page.getByRole('button', { name: 'Open search', exact: true }).click();
  await expect(search.getByRole('searchbox')).toHaveValue('no-such-template');
  await search.getByRole('searchbox').fill('wedding');
  await search.getByRole('button', { name: 'Submit search', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\?q=wedding$/);
  await expect(page.locator('#templates a[href^="/templates/"]').first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/q=no-such-template$/);
  if (mobile) await page.getByRole('button', { name: 'Open search', exact: true }).click();
  await expect(search.getByRole('searchbox')).toHaveValue('no-such-template');
  if (mobile) {
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(page.locator('[data-app-header]')).toHaveClass(/iv-shared-header-scrolled/);
  await expect(page.locator('[data-app-header]')).toHaveCSS('height', '64px');
  expect((await page.locator('[data-app-header]').boundingBox())?.y).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('header.png') });
  await page.evaluate(() => { Object.assign(window, { headerAuthDocument: 'same' }); });
  await avatar.click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-app-header]')).toHaveCount(0);
  await expect(page.locator('header.iv-header')).toHaveCount(1);
  expect(await page.evaluate(() => (window as Window & { headerAuthDocument?: string }).headerAuthDocument)).toBe('same');
});

test('logged-out public headers remain and auth pages have no app header', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'desktop and mobile coverage');
  for (const route of ['/', '/terms', '/privacy']) {
    await page.goto(route);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('[data-app-header]')).toHaveCount(0);
  }
  for (const route of ['/login', '/signup', '/forgot-password']) {
    await page.goto(route);
    await expect(page.locator('[data-app-header]')).toHaveCount(0);
    await expect(page.getByText(/Test credentials/)).toHaveCount(route === '/login' ? 1 : 0);
  }
  await page.goto('/login');
  await page.evaluate(() => { Object.assign(window, { headerAuthDocument: 'same' }); });
  await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('Demo@1234');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.locator('[data-app-header]')).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { headerAuthDocument?: string }).headerAuthDocument)).toBe('same');
});
