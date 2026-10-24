import { expect, test as base } from '@playwright/test';
import { resetMockData } from './helpers';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    // Playwright fixtures use a `use` callback; it is unrelated to React hooks.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    expect([...new Set(errors)], 'browser console errors or uncaught exceptions').toEqual([]);
  },
});

test.beforeEach(async ({ page }) => {
  await resetMockData(page);
});

export { expect };
