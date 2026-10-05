import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const route = '/33rd-board-accomplishments';

test('the report is directly accessible but excluded from incoming links and indexing artifacts', async () => {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  const dist = resolve(root.pathname, 'dist');
  const html = await readFile(resolve(dist, '33rd-board-accomplishments/index.html'), 'utf8').catch(() => '');
  assert.ok(html.includes('<h1'), 'the report route must render a page');
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet"/);
  const headers = await readFile(resolve(dist, '_headers'), 'utf8');
  assert.match(headers, /\/33rd-board-accomplishments\*\s+X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);

  for (const entry of await readdir(dist, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = resolve(entry.parentPath, entry.name);
    const name = relative(dist, file);
    if (name === '33rd-board-accomplishments/index.html') continue;
    if (!/\.html$|sitemap.*\.xml$|pagefind/i.test(name)) continue;
    const content = await readFile(file, 'utf8');
    if (name.endsWith('.html')) {
      for (const [, href] of content.matchAll(/\bhref=["']([^"']+)["']/g)) {
        const url = new URL(href, 'https://msvincognito.nl');
        assert.ok(url.origin !== 'https://msvincognito.nl' || !url.pathname.startsWith(route), `${name} links to the report`);
      }
    } else {
      assert.ok(!content.includes(route), `${name} indexes the report`);
    }
  }
});
