import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('all routed application pages render and dynamic routes use real route destinations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'route audit runs once at desktop size');
  await loginAsDemo(page);
  const routes = [
    '/', '/dashboard', '/invitations', '/invitations/inv-001',
    '/invitations/inv-001/edit', '/templates/wedding-classic', '/profile',
    '/forgot-password', '/signup', '/i/not-a-real-slug', '/s/not-a-real-code',
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator('body'), route).not.toBeEmpty();
  }
  await page.goto('/i/not-a-real-slug');
  await expect(page.getByRole('heading', { name: /invitation not available/i })).toBeVisible();
  const guestsResponse = await page.request.get('/api/invitations/inv-001/guests');
  const guests = await guestsResponse.json() as Array<{ code: string }>;
  expect(guests.length).toBeGreaterThan(0);
  await page.goto(`/rsvp/${guests[0].code}`);
  await expect(page).toHaveURL(new RegExp(`/s/${guests[0].code}$`));
});

test('every template registry entry and server route exists', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'route audit runs once at desktop size');
  await loginAsDemo(page);
  const templateIds = [
    'wedding-classic', 'wedding-modern', 'wedding-tropical', 'birthday-festive', 'birthday-kids',
    'birthday-elegant', 'baby-pastel', 'baby-gender-reveal', 'baby-woodland', 'house-modern',
    'house-traditional', 'house-garden', 'religious-almsgiving', 'religious-first-birthday',
    'religious-pooja', 'corporate-conference', 'corporate-gala', 'corporate-launch',
  ];
  for (const id of templateIds) {
    const response = await page.goto(`/templates/${id}`);
    expect(response?.status(), id).toBeLessThan(500);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  }
});
