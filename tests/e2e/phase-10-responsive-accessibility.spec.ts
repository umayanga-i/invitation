import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

declare global {
  interface Window { axe?: { run: (context: Document) => Promise<{ violations: Array<{ id: string; impact?: string; help: string; nodes: Array<{ target: string[] }> }> }> } }
}

test('8 primary pages render at this viewport without horizontal overflow and save screenshots', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.screenshot({ path: `tests/screenshots/phase10-login-${testInfo.project.name}.png`, fullPage: true, caret: 'initial' });
  await loginAsDemo(page);

  const guests = await (await page.request.get('/api/invitations/inv-001/guests')).json() as Array<{ code: string }>;
  const common = await (await page.request.get('/api/invitations/inv-002')).json() as { slug: string };
  const pages = [
    ['home', '/'],
    ['dashboard', '/dashboard'],
    ['invitations', '/invitations'],
    ['invitation-management', '/invitations/inv-001'],
    ['template-editor', '/templates/wedding-classic'],
    ['profile', '/profile'],
    ['common-guest', `/i/${common.slug}`],
    ['personal-guest', `/s/${guests[0].code}`],
  ] as const;

  for (const [name, url] of pages) {
    await page.goto(url);
    await expect(page.locator('body')).toBeVisible();
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `${name} horizontal overflow at ${testInfo.project.name}`).toBeLessThanOrEqual(dimensions.width + 1);
    await page.screenshot({ path: `tests/screenshots/phase10-${name}-${testInfo.project.name}.png`, fullPage: true, caret: 'initial' });
  }
});

test('axe checks public, login, home and dashboard; reports small targets and missing labels', async ({ page }, testInfo) => {
  const findings: Array<{ route: string; violations: Array<{ id: string; impact?: string; help: string; nodes: Array<{ target: string[]; failureSummary?: string }> }> }> = [];
  const componentMetrics: Array<{ route: string; unlabeledInputs: number; unnamedButtons: number; smallTargets: number }> = [];
  const measureControls = async (route: string) => {
    const metrics = await page.evaluate(() => {
      const unlabeledInputs = [...document.querySelectorAll('input:not([type="hidden"]), textarea, select')].filter((element) => !(element as HTMLInputElement).labels?.length && !element.getAttribute('aria-label'));
      const unnamedButtons = [...document.querySelectorAll('button')].filter((element) => !element.innerText.trim() && !element.getAttribute('aria-label') && !element.getAttribute('title'));
      const smallTargets = [...document.querySelectorAll('a, button, input, select, textarea')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      }).length;
      return { unlabeledInputs: unlabeledInputs.length, unnamedButtons: unnamedButtons.length, smallTargets };
    });
    componentMetrics.push({ route, ...metrics });
  };
  await page.goto('/login');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const loginResult = await page.evaluate(async () => await window.axe!.run(document));
  findings.push({ route: '/login', violations: loginResult.violations });
  await measureControls('/login');
  await loginAsDemo(page);
  const common = await (await page.request.get('/api/invitations/inv-002')).json() as { slug: string };
  const routes = ['/', '/dashboard', `/i/${common.slug}`];
  for (const route of routes) {
    await page.goto(route);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const result = await page.evaluate(async () => await window.axe!.run(document));
    findings.push({ route, violations: result.violations });
    await measureControls(route);
  }
  await testInfo.attach('axe-results.json', { body: JSON.stringify(findings, null, 2), contentType: 'application/json' });
  await testInfo.attach('control-metrics.json', { body: JSON.stringify(componentMetrics, null, 2), contentType: 'application/json' });
  const serious = findings.flatMap((item) => item.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious').map((violation) => `${item.route}: ${violation.id} (${violation.nodes.length})`));
  const seriousDetails = findings.flatMap((item) => item.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => ({ route: item.route, id: violation.id, targets: violation.nodes.map((node) => ({ selector: node.target, summary: node.failureSummary })) })));
  console.log('Axe serious detail:', JSON.stringify(seriousDetails));
  expect(serious, 'critical/serious axe accessibility violations').toEqual([]);
  const smallerIssues = findings.flatMap((item) => item.violations.map((violation) => `${item.route}: ${violation.id}`));
  testInfo.annotations.push({ type: 'axe findings', description: smallerIssues.slice(0, 5).join('; ') || 'No axe violations.' });
  testInfo.annotations.push({ type: 'manual accessibility scan', description: JSON.stringify(componentMetrics) });
});

test('keyboard login and guest-add modal retain visible focus and close with Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'keyboard flow runs once on desktop');
  await page.goto('/login');
  const email = page.getByLabel('Email', { exact: true });
  for (let index = 0; index < 20 && !(await email.evaluate((element) => element === document.activeElement)); index += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(email).toBeFocused();
  await page.keyboard.type('demo@invite.test');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Demo@1234');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Show', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Hide', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/dashboard');
  await page.goto('/invitations/inv-001');
  const addButton = page.getByRole('button', { name: /Add guests/ });
  await addButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Add guests' });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus').evaluate((element) => Boolean(element.closest('dialog')))).resolves.toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const active = await page.locator(':focus').evaluate((element) => getComputedStyle(element).outlineStyle !== 'none' || element.className.toString().includes('focus'));
  expect(active).toBe(true);
});
