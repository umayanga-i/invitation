import { expect, test } from './fixtures';

test('email login validates required fields, unknown users, and passwords', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'authentication matrix runs on mobile and desktop');
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Email is required')).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('not-an-email');
  expect(await page.getByLabel('Email', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Password is required')).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('unknown@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('Demo@1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/Invalid email or password/)).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/Invalid email or password/)).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('Demo@1234');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Make every invitation/ })).toBeVisible();
});

test('signup enforces name, email, password, confirmation, and duplicate validation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'authentication matrix runs on mobile and desktop');
  await page.goto('/signup');
  await page.getByLabel('Email', { exact: true }).fill('not-an-email');
  expect(await page.getByLabel('Email', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await page.getByLabel('Email', { exact: true }).fill('new@invite.test');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm password', { exact: true }).fill('different');
  await page.getByRole('button', { name: 'Create Account' }).click();
  expect(await page.getByLabel('Full name').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await page.getByLabel('Full name').fill('New User');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('LongEnough123');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await page.getByLabel('Confirm password').fill('LongEnough123');
  await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText(/already exists|already registered/i)).toBeVisible();
});

test('phone OTP accepts the supported number formats and rejects wrong or incomplete codes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'authentication matrix runs on mobile and desktop');
  await page.goto('/login');
  await page.getByRole('button', { name: 'Phone' }).click();
  const phone = page.getByLabel('Phone Number');
  for (const value of ['+94 77 000 0000', '0770000000', '94770000000']) {
    await phone.fill(value);
    await page.getByRole('button', { name: 'Send OTP' }).click();
    await expect(page.getByLabel('One-Time Password')).toBeVisible();
    await page.getByRole('button', { name: 'Verify & Sign In' }).click();
    await expect(page.getByText('OTP is required')).toBeVisible();
    await page.getByLabel('One-Time Password').fill('12345x7890');
    await expect(page.getByLabel('One-Time Password')).toHaveValue('12345');
    await page.getByLabel('One-Time Password').fill('000000');
    await page.getByRole('button', { name: 'Verify & Sign In' }).click();
    await expect(page.getByText(/Invalid OTP/)).toBeVisible();
    if (value === '+94 77 000 0000') {
      await page.evaluate(() => localStorage.setItem('auth:otp-issued-at', '1'));
      await page.getByLabel('One-Time Password').fill('123456');
      await page.getByRole('button', { name: 'Verify & Sign In' }).click();
      await expect(page.getByText(/OTP expired/)).toBeVisible();
      await page.getByRole('button', { name: 'Change number' }).click();
      await page.getByRole('button', { name: 'Send OTP' }).click();
    }
    await page.getByLabel('One-Time Password').fill('123456');
    await page.getByRole('button', { name: 'Verify & Sign In' }).click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await page.waitForURL('**/login');
    await page.goto('/login');
    await page.getByRole('button', { name: 'Phone' }).click();
  }
});

test('Google login, protected redirects, logged-in login redirect, logout, and back navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'authentication matrix runs on mobile and desktop');
  for (const path of ['/dashboard', '/invitations', '/invitations/inv-001', '/templates/wedding-classic', '/profile']) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?from=${encodeURIComponent(path).replaceAll('/', '%2F')}`));
    await page.getByLabel('Email', { exact: true }).fill('demo@invite.test');
    await page.getByLabel('Password', { exact: true }).fill('Demo@1234');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(`**${path}`);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await page.waitForURL('**/login');
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  }
  await page.goto('/login');
  await page.getByRole('button', { name: 'Google' }).click();
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await expect(page.getByText('demo.google@gmail.com')).toBeVisible();
});

test('forgot password provides feedback and a route back to login; credentials are dev-only UI', async ({ page }, testInfo) => {
  await page.goto('/login');
  await expect(page.getByText('Dev Mode')).toBeVisible();
  await page.goto('/forgot-password');
  await expect(page.getByRole('link', { name: /sign in|back to login/i })).toBeVisible();
  const email = page.getByLabel(/email/i);
  await email.fill('demo@invite.test');
  await page.getByRole('button', { name: /send|reset/i }).click();
  await expect(page.getByText(/check your inbox|reset link|if an account/i)).toBeVisible();
  testInfo.annotations.push({ type: 'environment', description: 'Development banner checked in dev webServer; production-only rendering requires a production server.' });
});
