import type { Page } from '@playwright/test';

export async function resetMockData(page: Page): Promise<void> {
  const response = await page.request.post('/api/test/reset');
  if (!response.ok()) throw new Error(`Mock data reset failed (${response.status()})`);
}

export async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('Demo@1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
}

