import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dutchPdf = '/assets/documents/statuten-nederlands.pdf';
const englishPdf = '/assets/documents/statutes-english-translation.pdf';

test('the production site publishes both statutes documents from one statutes page', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/statutes/index.html', import.meta.url), 'utf8');
  assert.match(html, new RegExp(`href="${dutchPdf}"`));
  assert.match(html, new RegExp(`href="${englishPdf}"`));

  for (const documentPath of [dutchPdf, englishPdf]) {
    const pdf = await readFile(new URL(`../dist${documentPath}`, import.meta.url));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  }
});

test('visitors can find the statutes page from the site footer', async () => {
  const home = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(home, /href="\/statutes"[^>]*>Statutes<\/a>/);
});
