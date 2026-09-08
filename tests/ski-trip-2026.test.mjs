import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('..', import.meta.url);
const outputRoot = fileURLToPath(new URL('../dist/', import.meta.url));

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findHtmlFiles(entryPath) : [entryPath];
  }));

  return files.flat().filter((file) => file.endsWith('.html'));
}

test('ski trip page is privately discoverable by direct URL with its video and booking action', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  const pagePath = new URL('../dist/ski-trip-2026/index.html', import.meta.url);
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /<body class="ski-trip-page">/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /src="https:\/\/www\.youtube\.com\/embed\/fl76DrUPt0w\?feature=oembed"/);
  assert.match(html, /title="Ski Trip 2026 video"/);
  assert.match(html, /href="https:\/\/www\.sunweb\.nl\/groups\/totallysnow\/bookingpage\/extras\?bookingNumber=6627072"/);
  assert.match(html, /Get your tickets now!/i);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);

  const allHtmlFiles = await findHtmlFiles(outputRoot);
  const otherPages = allHtmlFiles.filter((file) => path.resolve(file) !== path.resolve(fileURLToPath(pagePath)));
  const otherHtml = await Promise.all(otherPages.map((file) => readFile(file, 'utf8')));

  for (const otherPage of otherHtml) {
    assert.doesNotMatch(otherPage, /href="\/ski-trip-2026\/?"/);
  }
});
