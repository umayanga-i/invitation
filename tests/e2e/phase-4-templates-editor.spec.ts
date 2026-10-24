import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

const templateIds = [
  'wedding-classic', 'wedding-modern', 'wedding-tropical', 'birthday-festive', 'birthday-kids',
  'birthday-elegant', 'baby-pastel', 'baby-gender-reveal', 'baby-woodland', 'house-modern',
  'house-traditional', 'house-garden', 'religious-almsgiving', 'religious-first-birthday',
  'religious-pooja', 'corporate-conference', 'corporate-gala', 'corporate-launch',
];

test('all 18 templates render at mobile and desktop sizes and tolerate long multilingual content', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'desktop', 'the complete screenshot matrix runs once at desktop project');
  await loginAsDemo(page);
  const screenshots = path.resolve('tests/screenshots');
  await mkdir(screenshots, { recursive: true });
  for (const id of templateIds) {
    await page.goto(`/templates/${id}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: path.join(screenshots, `${id}-360.png`), fullPage: true, caret: 'initial' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: path.join(screenshots, `${id}-1280.png`), fullPage: true, caret: 'initial' });

    const host = 'Very Long Host Name '.repeat(16) + 'தமிழ் සිංහල 🎉';
    await page.getByLabel('Host name(s)').fill(host);
    await page.getByLabel('Message').fill(('A long celebration message සිංහල தமிழ் 🎉. ').repeat(18));
    await page.getByLabel('Map link (optional)').fill('');
    await expect(page.getByLabel('Live invitation preview').getByRole('heading', { level: 1 })).toContainText(host);
    expect(await page.getByLabel('Message').inputValue()).toHaveLength(500);
    await page.getByLabel('Invitation photo (optional)').setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
    await expect(page.getByText(/This image could not be opened/)).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.width, `${id} horizontal overflow`).toBeLessThanOrEqual(dimensions.viewport);
    await page.setViewportSize({ width: 1280, height: 800 });
  }
});

test('editor live preview, color controls, invitation type, validation, and save flow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'editor save flow runs once');
  await loginAsDemo(page);
  await page.goto('/templates/wedding-classic');
  await page.getByLabel('Host name(s)').fill('Asha & Kavi');
  await expect(page.getByText('Asha & Kavi', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Event title').fill('Garden Wedding');
  await expect(page.getByLabel('Live invitation preview').getByText('Garden Wedding', { exact: true })).toBeVisible();
  await page.getByLabel('Date', { exact: true }).fill('2027-05-09');
  await expect(page.getByLabel('Live invitation preview').getByText('2027-05-09', { exact: true })).toBeVisible();
  await page.getByLabel('Time', { exact: true }).fill('18:45');
  await expect(page.getByLabel('Live invitation preview').getByText('18:45', { exact: true })).toBeVisible();
  await page.getByLabel('Venue').fill('Colombo');
  await expect(page.getByLabel('Live invitation preview').getByText('Colombo', { exact: true })).toBeVisible();
  const message = page.getByLabel('Message');
  await message.fill('x'.repeat(510));
  expect(await message.inputValue()).toHaveLength(500);
  for (const label of ['primary', 'secondary', 'accent']) {
    const picker = page.getByLabel(label, { exact: true });
    await picker.fill('#123456');
    await expect(picker).toHaveValue('#123456');
  }
  await expect(page.getByLabel('Live invitation preview').getByRole('heading', { level: 1 })).toHaveCSS('color', 'rgb(18, 52, 86)');
  await page.getByRole('button', { name: 'Personal', exact: true }).click();
  await page.getByLabel('Guest name').fill('Nadeesha Perera');
  await page.getByRole('button', { name: 'Save invitation' }).click();
  await expect(page).toHaveURL(/\/invitations\/inv-/);
  await expect(page.getByRole('heading', { name: 'Garden Wedding' }).first()).toBeVisible();
  await expect(page.getByText(/personal/i).first()).toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Open invitation: Garden Wedding' })).toBeVisible();
});

test('personal invitation requires a guest name and required fields block saving', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'validation flow runs once');
  await loginAsDemo(page);
  await page.goto('/templates/wedding-classic');
  await page.getByRole('button', { name: 'Personal', exact: true }).click();
  await page.getByLabel('Guest name').fill('');
  await page.getByRole('button', { name: 'Save invitation' }).click();
  await expect(page.getByText(/Add a guest name/)).toBeVisible();
  await expect(page).toHaveURL(/\/templates\/wedding-classic/);
});
