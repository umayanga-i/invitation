import { expect, test } from './fixtures';
import { readFile } from 'node:fs/promises';

test('QA report records phases 0–10, open issues and rerun command', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'report integrity runs once');
  const report = await readFile('TEST_REPORT.md', 'utf8');
  expect(report).toContain('## Phases 5–8 run');
  expect(report).toMatch(/P[0-9]+-[0-9]+.*\| 9 \|/);
  expect(report).toMatch(/P[0-9]+-[0-9]+.*\| 10 \|/);
  expect(report).toContain('## How to rerun');
  expect(report).toContain('npx playwright test');
  expect(report).toContain('## Still open');
  expect(report).toContain('## Missing features');
});
