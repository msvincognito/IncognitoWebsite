import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  chooseIndex,
  choosePrompt,
  chooseReadableForeground,
  createWheelSegments,
  initializeQrRoulette,
  validatePromptData,
} from '../src/lib/qr-roulette.mjs';

const data = JSON.parse(
  await readFile(new URL('../src/data/qr-prompts.json', import.meta.url), 'utf8'),
);

function relativeLuminance(hexColor) {
  const channels = [1, 3, 5].map((offset) => (
    Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255
  )).map((channel) => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(firstColor, secondColor) {
  const luminances = [relativeLuminance(firstColor), relativeLuminance(secondColor)]
    .sort((first, second) => second - first);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

test('sample prompt data is valid and editor-facing', () => {
  const categories = validatePromptData(data);

  assert.equal(data.contentStatus, 'sample');
  assert.equal(categories.length, 6);
  assert.ok(categories.every(({ category, color, prompts }) => (
    category.length > 0
    && /^#[0-9a-f]{6}$/i.test(color)
    && prompts.length >= 2
    && prompts.every((prompt) => prompt.length > 0)
  )));
});

test('invalid prompt data fails with a useful build-time message', () => {
  assert.throws(
    () => validatePromptData({ contentStatus: 'sample', categories: [] }),
    /at least two categories/i,
  );
  assert.throws(
    () => validatePromptData({
      contentStatus: 'sample',
      categories: [
        { category: 'One', color: '#155eef', prompts: ['Question'] },
        { category: 'Two', color: 'blue', prompts: [] },
      ],
    }),
    /category 2.*six-digit hex color/i,
  );
});

test('wheel labels automatically use the higher-contrast brand foreground', () => {
  const expectedForegrounds = [
    '#071526',
    '#ffffff',
    '#ffffff',
    '#071526',
    '#071526',
    '#ffffff',
  ];

  const actualForegrounds = data.categories.map(({ color }) => chooseReadableForeground(color));
  assert.deepEqual(actualForegrounds, expectedForegrounds);
  assert.ok(data.categories.every(({ color }, index) => (
    contrastRatio(color, actualForegrounds[index]) >= 4.5
  )));

  const segments = createWheelSegments(validatePromptData(data));
  assert.deepEqual(segments.map(({ labelColor }) => labelColor), expectedForegrounds);
});

test('wheel geometry creates one closed segment and readable label per category', () => {
  const categories = validatePromptData(data);
  const segments = createWheelSegments(categories);

  assert.equal(segments.length, categories.length);
  assert.ok(segments.every(({ path, labelX, labelY, labelRotation }) => (
    path.startsWith('M 160 160 L ')
    && path.endsWith(' Z')
    && Number.isFinite(labelX)
    && Number.isFinite(labelY)
    && Number.isFinite(labelRotation)
  )));
});

test('random helpers select boundary values and avoid an immediate prompt repeat', () => {
  assert.equal(chooseIndex(6, () => 0), 0);
  assert.equal(chooseIndex(6, () => 0.999999), 5);
  assert.throws(() => chooseIndex(0), /positive length/i);

  const prompts = ['First', 'Second', 'Third'];
  assert.equal(choosePrompt(prompts, 'First', () => 0), 'Second');
  assert.equal(choosePrompt(['Only'], 'Only', () => 0.8), 'Only');
});

test('production build emits an unlisted QR roulette with generated SVG segments', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/qr/index.html', import.meta.url), 'utf8');
  const segmentCount = html.match(/<g data-wheel-segment/g)?.length ?? 0;

  assert.equal(segmentCount, data.categories.length);
  assert.match(html, /data-qr-roulette/);
  assert.match(html, /data-spin/);
  assert.match(html, /data-another/);
  assert.match(html, /data-reset/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /class="site-header"/);
  assert.doesNotMatch(html, /class="site-footer"/);
  assert.match(html, /<script src="\/matomo-consent\.js" defer><\/script>/);
});

test('built wheel and result labels preserve accessible contrast', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/qr/index.html', import.meta.url), 'utf8');
  const labelColors = [...html.matchAll(
    /<g data-wheel-segment[^>]*>\s*<path[^>]*fill="(#[0-9a-f]{6})"[^>]*><\/path>\s*<text[^>]*fill="(#[0-9a-f]{6})"/gi,
  )].map(([, background, foreground]) => ({ background, foreground }));

  assert.equal(labelColors.length, data.categories.length);
  assert.ok(labelColors.every(({ background, foreground }) => (
    contrastRatio(background, foreground) >= 4.5
  )));
  assert.doesNotMatch(html, /\.qr-wheel text\s*\{[^}]*fill\s*:/);

  const resultCategoryColor = html.match(
    /\.qr-result__category\s*\{[^}]*color:\s*(#[0-9a-f]{6})/i,
  )?.[1];
  assert.ok(resultCategoryColor);
  assert.ok(contrastRatio(resultCategoryColor, '#ffffff') >= 4.5);
});

class FakeElement {
  constructor() {
    this.attributes = new Map();
    this.dataset = {};
    this.disabled = false;
    this.hidden = false;
    this.listeners = new Map();
    this.style = { values: new Map(), setProperty: (key, value) => this.style.values.set(key, value) };
    this.textContent = '';
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click() {
    for (const listener of this.listeners.get('click') ?? []) listener();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

function createRouletteRoot(categories = data.categories) {
  const elements = new Map([
    ['[data-wheel]', new FakeElement()],
    ['[data-spin]', new FakeElement()],
    ['[data-result]', new FakeElement()],
    ['[data-result-category]', new FakeElement()],
    ['[data-result-prompt]', new FakeElement()],
    ['[data-announcement]', new FakeElement()],
    ['[data-another]', new FakeElement()],
    ['[data-reset]', new FakeElement()],
    ['[data-error]', new FakeElement()],
  ]);
  const segments = categories.map(() => new FakeElement());
  const root = new FakeElement();
  root.dataset.categories = JSON.stringify(categories);
  root.dataset.state = 'ready';
  root.querySelector = (selector) => elements.get(selector) ?? null;
  root.querySelectorAll = (selector) => selector === '[data-wheel-segment]' ? segments : [];

  return { root, elements, segments };
}

test('spin locks controls, rotates to a deterministic category, then reveals its prompt', () => {
  const page = createRouletteRoot();
  const scheduled = [];
  const controller = initializeQrRoulette({
    root: page.root,
    random: () => 0,
    reducedMotion: false,
    schedule: (callback, delay) => scheduled.push({ callback, delay }),
  });

  controller.spin();

  assert.equal(page.root.dataset.state, 'spinning');
  assert.equal(page.elements.get('[data-spin]').disabled, true);
  assert.equal(scheduled[0].delay, 2600);
  assert.match(page.elements.get('[data-wheel]').style.values.get('--wheel-rotation'), /deg$/);

  scheduled[0].callback();

  assert.equal(page.root.dataset.state, 'result');
  assert.equal(page.elements.get('[data-result]').hidden, false);
  assert.equal(page.elements.get('[data-result-category]').textContent, data.categories[0].category);
  assert.equal(page.elements.get('[data-result-prompt]').textContent, data.categories[0].prompts[0]);
  assert.match(page.elements.get('[data-announcement]').textContent, /Student life/);
  assert.equal(page.segments[0].attributes.get('data-selected'), 'true');
});

test('reduced motion reveals the same deterministic result without a long spin', () => {
  const page = createRouletteRoot();
  const scheduled = [];
  const controller = initializeQrRoulette({
    root: page.root,
    random: () => 0,
    reducedMotion: true,
    schedule: (callback, delay) => scheduled.push({ callback, delay }),
  });

  controller.spin();

  assert.equal(scheduled[0].delay, 80);
  scheduled[0].callback();
  assert.equal(page.root.dataset.state, 'result');
});

test('another prompt stays in the category without an immediate repeat and reset restores the wheel', () => {
  const page = createRouletteRoot();
  const scheduled = [];
  const controller = initializeQrRoulette({
    root: page.root,
    random: () => 0,
    reducedMotion: false,
    schedule: (callback) => scheduled.push(callback),
  });

  controller.spin();
  scheduled[0]();
  const firstPrompt = page.elements.get('[data-result-prompt]').textContent;
  controller.anotherPrompt();

  assert.notEqual(page.elements.get('[data-result-prompt]').textContent, firstPrompt);
  assert.equal(page.elements.get('[data-result-category]').textContent, data.categories[0].category);

  controller.reset();
  assert.equal(page.root.dataset.state, 'ready');
  assert.equal(page.elements.get('[data-result]').hidden, true);
  assert.equal(page.elements.get('[data-spin]').disabled, false);
});

test('an unexpected result-rendering error restores the spin control and shows retry guidance', () => {
  const page = createRouletteRoot();
  const scheduled = [];
  page.elements.set('[data-result-prompt]', null);
  const controller = initializeQrRoulette({
    root: page.root,
    random: () => 0,
    reducedMotion: false,
    schedule: (callback) => scheduled.push(callback),
  });

  controller.spin();
  scheduled[0]();

  assert.equal(page.root.dataset.state, 'ready');
  assert.equal(page.elements.get('[data-spin]').disabled, false);
  assert.equal(page.elements.get('[data-error]').hidden, false);
  assert.equal(page.elements.get('[data-result]').hidden, false);
});

test('built QR page contains the phone-first transition and accessibility safeguards', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/qr/index.html', import.meta.url), 'utf8');

  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /env\(safe-area-inset-bottom\)/);
  assert.match(html, /body\.qr-page #incognito-privacy-settings/);
  assert.match(html, /min-width:\s*760px\) and \(max-height:\s*950px/);
  assert.match(html, /data-state="ready"/);
  assert.match(html, /data-result[^>]*hidden/);
  assert.match(html, /class="qr-pointer"/);
  assert.match(html, /class="qr-result/);
  assert.match(html, /noindex, nofollow/);
});

test('existing source navigation and content do not advertise the QR route', async () => {
  const { readdir } = await import('node:fs/promises');
  const sourceRoot = new URL('../src/', import.meta.url);
  const entries = await readdir(sourceRoot, { recursive: true, withFileTypes: true });
  const publicContentFiles = entries.filter((entry) => (
    entry.isFile()
    && /\.(astro|mdx)$/.test(entry.name)
    && entry.name !== 'qr.astro'
  ));

  for (const entry of publicContentFiles) {
    const source = await readFile(new URL(`${entry.parentPath.slice(sourceRoot.pathname.length)}/${entry.name}`, sourceRoot), 'utf8');
    assert.doesNotMatch(source, /href=["']\/qr\/?["']/);
  }
});
