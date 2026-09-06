import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('production build publishes the branded links hub with its essential destinations', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/links/index.html', import.meta.url), 'utf8');

  assert.match(html, /<body class="links-page">/);
  assert.match(html, /class="site-header"/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /href="https:\/\/tickets\.msvincognito\.nl\/incognito"/);
  assert.match(html, /href="\/tutors"/);
  assert.match(html, /href="https:\/\/forms\.gle\/VBYabxf7uhgMP6to9"/);
  assert.match(html, /href="https:\/\/store\.msvincognito\.nl"/);
  assert.match(html, /href="https:\/\/instagram\.com\/msvincognito"/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/company\/msv-incognito\/"/);
  assert.match(html, /href="mailto:incognito@maastrichtuniversity\.nl"/);
});

test('external links on the links hub open safely in a new tab', async () => {
  const html = await readFile(new URL('../dist/links/index.html', import.meta.url), 'utf8');
  const externalAnchors = [...html.matchAll(/<a\s+([^>]*data-external[^>]*)>/g)];

  assert.ok(externalAnchors.length >= 6);
  for (const [, attributes] of externalAnchors) {
    assert.match(attributes, /target="_blank"/);
    assert.match(attributes, /rel="noopener noreferrer"/);
  }
});
