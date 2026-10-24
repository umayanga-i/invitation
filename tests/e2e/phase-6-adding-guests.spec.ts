import { expect, test } from './fixtures';
import { loginAsDemo } from './helpers';

test('single guest validation, normalization, paste parsing and CSV checks', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'guest import and 500-code stress run once');
  test.setTimeout(120_000);
  await loginAsDemo(page);
  await page.goto('/invitations/inv-001');
  await page.getByRole('button', { name: /Add guests/ }).click();
  let dialog = page.getByRole('dialog', { name: 'Add guests' });
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Enter a name and valid');
  await dialog.getByLabel('Name').fill('Single Guest');
  await dialog.getByLabel('Phone').fill('0712345678');
  await dialog.getByLabel('Email (optional)').fill('single@example.test');
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('1 guest added');
  const singleGuests = await (await page.request.get('/api/invitations/inv-001/guests')).json() as Array<{ name: string; phone: string }>;
  expect(singleGuests.find((guest) => guest.name === 'Single Guest')?.phone).toBe('94712345678');

  await page.getByRole('button', { name: /Add guests/ }).click();
  dialog = page.getByRole('dialog', { name: 'Add guests' });
  await dialog.getByRole('button', { name: 'Paste list' }).click();
  const pasteBulkRows = Array.from({ length: 200 }, (_, index) => `Paste Bulk ${index},077${String(4000000 + index).padStart(7, '0')},`).join('\n');
  const pasteRows = [
    ' Nadeesha Perera , 0771234001 , nadeesha@example.test ',
    'Duplicate Row, 94771234001, duplicate@example.test',
    'Bad Number, 12345, bad@example.test',
    'தமிழ் Guest\t0771234002\ttamil@example.test',
    '',
    'සිංහල Guest, 0771234003, sinhala@example.test',
  ].join('\n') + `\n${pasteBulkRows}`;
  await dialog.getByLabel(/Paste rows/).fill(pasteRows);
  await expect(dialog.getByText('Duplicate', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Invalid', { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText('Ready', { exact: true }).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('203 guests added');

  await page.getByRole('button', { name: /Add guests/ }).click();
  dialog = page.getByRole('dialog', { name: 'Add guests' });
  await dialog.getByRole('button', { name: 'Upload CSV' }).click();
  const csvRows = ['name,phone,email', '"Silva, Kamal",0771234010,kamal@example.test', 'தமிழ் விருந்தினர்,0771234011,tamil@example.test', ...Array.from({ length: 200 }, (_, index) => `CSV Bulk ${index},077${String(5000000 + index).padStart(7, '0')},bulk${index}@example.test`)];
  await dialog.getByLabel('Choose a CSV file').setInputFiles({ name: 'guests.csv', mimeType: 'text/csv', buffer: Buffer.from(csvRows.join('\n')) });
  await expect(dialog.getByText('Silva, Kamal', { exact: true })).toBeVisible();
  await expect(dialog.getByText('தமிழ் விருந்தினர்', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('row')).toHaveCount(203);
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('202 guests added');

  await page.getByRole('button', { name: /Add guests/ }).click();
  dialog = page.getByRole('dialog', { name: 'Add guests' });
  await dialog.getByRole('button', { name: 'Upload CSV' }).click();
  await dialog.getByLabel('Choose a CSV file').setInputFiles({ name: 'missing-columns.csv', mimeType: 'text/csv', buffer: Buffer.from('phone\n12345') });
  await expect(dialog.getByText('Invalid', { exact: true }).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('no valid');

  await dialog.getByLabel('Choose a CSV file').setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.from('') });
  await dialog.getByRole('button', { name: 'Add guests', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('no valid');

  await dialog.getByLabel('Choose a CSV file').setInputFiles({ name: 'guests.txt', mimeType: 'text/plain', buffer: Buffer.from('Wrong Type Guest,0771234020,wrong@example.test') });
  await expect(dialog.getByRole('alert')).toContainText(/CSV/i);
  await expect(dialog.getByText('Wrong Type Guest', { exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
});

test('500 generated guests receive unique short non-sequential personal codes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '500-code stress run once');
  test.setTimeout(120_000);
  await loginAsDemo(page);
  const codes: string[] = [];
  for (let batchStart = 0; batchStart < 500; batchStart += 100) {
    const inputs = Array.from({ length: 100 }, (_, offset) => {
      const serial = batchStart + offset;
      return { name: `Code Stress ${serial}`, phone: `947${String(80000000 + serial).padStart(8, '0')}` };
    });
    const response = await page.request.post('/api/invitations/inv-001/guests', { data: { inputs } });
    expect(response.status()).toBe(201);
    const guests = await response.json() as Array<{ code: string }>;
    codes.push(...guests.map((guest) => guest.code));
  }
  expect(codes).toHaveLength(500);
  expect(new Set(codes).size).toBe(500);
  expect(codes.every((code) => /^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(code))).toBe(true);
  expect(codes.every((code) => `http://localhost:3000/s/${code}`.length < 40)).toBe(true);
  expect(new Set(codes.slice(0, 50)).size).toBe(50);
  expect(codes.slice(0, 50)).not.toEqual(Array.from({ length: 50 }, (_, index) => String(index).padStart(8, '0')));
});
