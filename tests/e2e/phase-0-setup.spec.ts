import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('development reset endpoint restores seeded database and login helper works', async ({ page }) => {
  await loginAsDemo(page);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('My invitations', { exact: true })).toBeVisible();
});
