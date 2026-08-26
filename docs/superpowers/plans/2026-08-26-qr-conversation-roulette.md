# QR Conversation Roulette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an unlisted, phone-first `/qr` route that spins an automatically generated SVG category wheel and reveals an editable random conversation prompt.

**Architecture:** Keep editable content in one JSON file, put validation, geometry, random selection, and DOM state behavior in one testable ES module, and render the route through a focused Astro component without the normal site header or footer. Astro generates the initial SVG and bundles the small client controller; no runtime network or persistence layer is introduced.

**Tech Stack:** Astro 5, JavaScript ES modules, SVG, scoped CSS, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-08-26-qr-conversation-roulette-design.md`

## Global Constraints

- The permanent route is `/qr`, and all printed QR codes use that same URL.
- Do not link `/qr` from the header, footer, navigation, sitemap content, or any other website page.
- Portrait phone screens are the primary layout target; larger screens remain usable.
- The approved interaction is wheel-first, transitioning to a large prompt-first result panel after the spin.
- Editors change category labels, segment colors, and prompts only in `src/data/qr-prompts.json`; they never edit SVG markup.
- The initial categories and prompts are explicitly marked as sample content.
- The page has no normal site header or footer, sound, account, cookie, saved history, database, or external request.
- Existing analytics and consent behavior remain unchanged.
- Reduced-motion users receive the same result through a short non-spinning transition.
- Invalid content fails the production build with a specific error.

---

## File Structure

- Create `src/data/qr-prompts.json`: the only editor-facing category and prompt source.
- Create `src/lib/qr-roulette.mjs`: validation, SVG geometry, random choice helpers, and the browser controller.
- Create `src/components/QrWheel.astro`: semantic wheel markup, SVG rendering, controls, result panel, and scoped responsive styles.
- Create `src/pages/qr.astro`: the focused document shell, metadata, analytics controller, and route composition.
- Create `tests/qr-roulette.test.mjs`: unit coverage for validation, geometry, selection, state transitions, route output, and route isolation.

### Task 1: Prompt Data, Validation, Geometry, and Selection

**Files:**
- Create: `src/data/qr-prompts.json`
- Create: `src/lib/qr-roulette.mjs`
- Create: `tests/qr-roulette.test.mjs`

**Interfaces:**
- Consumes: JSON shaped as `{ contentStatus: "sample" | "final", categories: Array<{ category: string, color: string, prompts: string[] }> }`.
- Produces: `validatePromptData(data)`, `createWheelSegments(categories, options?)`, `chooseIndex(length, random?)`, and `choosePrompt(prompts, previousPrompt?, random?)`.

- [ ] **Step 1: Write failing validation and selection tests**

Create `tests/qr-roulette.test.mjs` with these initial tests:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  chooseIndex,
  choosePrompt,
  createWheelSegments,
  validatePromptData,
} from '../src/lib/qr-roulette.mjs';

const data = JSON.parse(
  await readFile(new URL('../src/data/qr-prompts.json', import.meta.url), 'utf8'),
);

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
```

- [ ] **Step 2: Run the unit test and verify the missing module failure**

Run:

```bash
node --test tests/qr-roulette.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/qr-roulette.mjs`.

- [ ] **Step 3: Add explicitly marked sample content**

Create `src/data/qr-prompts.json`:

```json
{
  "contentStatus": "sample",
  "categories": [
    {
      "category": "Student life",
      "color": "#ef3b8f",
      "prompts": [
        "What surprised you most about student life in Maastricht?",
        "What is one thing every new student should try?"
      ]
    },
    {
      "category": "Campus",
      "color": "#155eef",
      "prompts": [
        "Where is your favorite place to study on campus?",
        "What would make a day at university better?"
      ]
    },
    {
      "category": "Technology",
      "color": "#5746d8",
      "prompts": [
        "Which piece of technology could you not live without?",
        "What technology are you curious to learn more about?"
      ]
    },
    {
      "category": "Future",
      "color": "#f57a32",
      "prompts": [
        "What would you love to be doing five years from now?",
        "Which skill would you like to learn next?"
      ]
    },
    {
      "category": "Just for fun",
      "color": "#0f9d8a",
      "prompts": [
        "What is a small thing that always makes your day better?",
        "Which fictional world would you visit for a weekend?"
      ]
    },
    {
      "category": "Incognito",
      "color": "#0b3f75",
      "prompts": [
        "What would you like a study association to organize?",
        "What makes you feel welcome at an event?"
      ]
    }
  ]
}
```

- [ ] **Step 4: Implement validation, geometry, and random helpers**

Create `src/lib/qr-roulette.mjs` with the following public behavior:

```js
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function validatePromptData(data) {
  if (!data || !Array.isArray(data.categories) || data.categories.length < 2) {
    throw new Error('QR prompt data must contain at least two categories.');
  }

  data.categories.forEach((entry, index) => {
    const label = `QR prompt category ${index + 1}`;
    if (!entry || typeof entry.category !== 'string' || !entry.category.trim()) {
      throw new Error(`${label} must have a non-empty category label.`);
    }
    if (typeof entry.color !== 'string' || !HEX_COLOR.test(entry.color)) {
      throw new Error(`${label} must use a six-digit hex color.`);
    }
    if (!Array.isArray(entry.prompts) || entry.prompts.length === 0) {
      throw new Error(`${label} must contain at least one prompt.`);
    }
    if (entry.prompts.some((prompt) => typeof prompt !== 'string' || !prompt.trim())) {
      throw new Error(`${label} contains an empty prompt.`);
    }
  });

  return data.categories.map((entry) => ({
    category: entry.category.trim(),
    color: entry.color,
    prompts: entry.prompts.map((prompt) => prompt.trim()),
  }));
}

function polarPoint(cx, cy, radius, degrees) {
  const radians = degrees * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function round(value) {
  return Number(value.toFixed(3));
}

export function createWheelSegments(categories, options = {}) {
  const center = options.center ?? 160;
  const radius = options.radius ?? 148;
  const labelRadius = options.labelRadius ?? 99;
  const sliceAngle = 360 / categories.length;

  return categories.map((entry, index) => {
    const startAngle = -90 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const centerAngle = startAngle + sliceAngle / 2;
    const start = polarPoint(center, center, radius, startAngle);
    const end = polarPoint(center, center, radius, endAngle);
    const label = polarPoint(center, center, labelRadius, centerAngle);
    const normalizedCenter = ((centerAngle % 360) + 360) % 360;
    const labelRotation = normalizedCenter > 90 && normalizedCenter < 270
      ? centerAngle + 180
      : centerAngle;

    return {
      ...entry,
      index,
      path: `M ${center} ${center} L ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 ${sliceAngle > 180 ? 1 : 0} 1 ${round(end.x)} ${round(end.y)} Z`,
      labelX: round(label.x),
      labelY: round(label.y),
      labelRotation: round(labelRotation),
    };
  });
}

export function chooseIndex(length, random = Math.random) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('Random selection requires a positive length.');
  }
  return Math.min(length - 1, Math.floor(random() * length));
}

export function choosePrompt(prompts, previousPrompt = '', random = Math.random) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('Prompt selection requires at least one prompt.');
  }
  const candidates = prompts.length > 1
    ? prompts.filter((prompt) => prompt !== previousPrompt)
    : prompts;
  return candidates[chooseIndex(candidates.length, random)];
}
```

- [ ] **Step 5: Run the unit test and verify it passes**

Run:

```bash
node --test tests/qr-roulette.test.mjs
```

Expected: 4 tests PASS.

- [ ] **Step 6: Commit the data engine**

```bash
git add src/data/qr-prompts.json src/lib/qr-roulette.mjs tests/qr-roulette.test.mjs
git commit -m "Add QR roulette data engine"
```

### Task 2: Static `/qr` Route and Generated SVG

**Files:**
- Create: `src/components/QrWheel.astro`
- Create: `src/pages/qr.astro`
- Modify: `tests/qr-roulette.test.mjs`

**Interfaces:**
- Consumes: `validatePromptData(data)` and `createWheelSegments(categories)` from Task 1.
- Produces: generated `/qr/index.html`, a `[data-qr-roulette]` root with serialized categories, an SVG wheel with `[data-wheel-segment]` nodes, and controls named `[data-spin]`, `[data-another]`, and `[data-reset]`.

- [ ] **Step 1: Add a failing production-route test**

Append to `tests/qr-roulette.test.mjs`:

```js
import { execFileSync } from 'node:child_process';

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
```

- [ ] **Step 2: Run the route test and verify the missing output failure**

Run:

```bash
node --test --test-name-pattern="production build emits" tests/qr-roulette.test.mjs
```

Expected: FAIL with `ENOENT` for `dist/qr/index.html`.

- [ ] **Step 3: Build the semantic SVG component**

Create `src/components/QrWheel.astro`. Its frontmatter must validate the imported JSON and derive segments before rendering:

```astro
---
import promptData from '../data/qr-prompts.json';
import { createWheelSegments, validatePromptData } from '../lib/qr-roulette.mjs';

const categories = validatePromptData(promptData);
const segments = createWheelSegments(categories);
const serializedCategories = JSON.stringify(categories);
---
```

Render this stable interface inside a `<section class="qr-roulette" data-qr-roulette data-state="ready" data-categories={serializedCategories}>`:

```astro
<div class="qr-roulette__intro">
  <img src="/assets/logo-dark.png" alt="MSV Incognito" width="650" height="159" />
  <p class="qr-roulette__eyebrow">Scan. Spin. Start talking.</p>
  <h1>Conversation<br /><em>roulette</em></h1>
  <p>Give the wheel a spin and see where the conversation takes you.</p>
</div>

<div class="qr-roulette__stage">
  <div class="qr-wheel-wrap">
    <div class="qr-pointer" aria-hidden="true"></div>
    <svg class="qr-wheel" data-wheel viewBox="0 0 320 320" role="img" aria-label="Conversation categories">
      {segments.map((segment) => (
        <g data-wheel-segment data-index={segment.index}>
          <path d={segment.path} fill={segment.color} />
          <text
            x={segment.labelX}
            y={segment.labelY}
            transform={`rotate(${segment.labelRotation} ${segment.labelX} ${segment.labelY})`}
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {segment.category}
          </text>
        </g>
      ))}
    </svg>
    <button class="qr-spin" type="button" data-spin>Spin</button>
  </div>

  <div class="qr-result" data-result hidden>
    <p class="qr-result__category" data-result-category></p>
    <p class="qr-result__prompt" data-result-prompt></p>
    <p class="sr-only" data-announcement aria-live="polite"></p>
    <div class="qr-result__actions">
      <button type="button" data-another>Another prompt</button>
      <button type="button" data-reset>Spin again</button>
    </div>
    <p class="qr-result__error" data-error hidden>Something interrupted the spin. Please try again.</p>
  </div>
</div>
```

Include a bundled Astro script at the end. Task 3 will implement the imported controller:

```astro
<script>
  import { initializeQrRoulette } from '../lib/qr-roulette.mjs';

  document.querySelectorAll('[data-qr-roulette]').forEach((root) => {
    initializeQrRoulette({ root });
  });
</script>
```

Add only enough scoped CSS in this task to keep the SVG visible and controls operable; Task 4 owns the final visual treatment.

- [ ] **Step 4: Create the focused page shell**

Create `src/pages/qr.astro` as its own document instead of using `BaseLayout`, because `BaseLayout` always renders the site header and footer. Import `../styles/global.css`, reproduce the existing theme bootstrap and metadata behavior, include the deferred analytics consent controller, and render `<QrWheel />`:

```astro
---
import QrWheel from '../components/QrWheel.astro';
import '../styles/global.css';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, viewport-fit=cover" />
    <meta name="description" content="Spin the Incognito conversation roulette and discover a question to ask." />
    <meta name="theme-color" content="#071526" />
    <meta name="robots" content="noindex, nofollow" />
    <script is:inline>
      (() => {
        const savedTheme = localStorage.getItem('incognito-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.dataset.theme = savedTheme || systemTheme;
      })();
    </script>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="canonical" href={Astro.url} />
    <title>Conversation Roulette — MSV Incognito</title>
    <script src="/matomo-consent.js" defer></script>
  </head>
  <body class="qr-page">
    <a class="skip-link" href="#qr-main">Skip to roulette</a>
    <main id="qr-main"><QrWheel /></main>
  </body>
</html>
```

- [ ] **Step 5: Add a temporary exported controller so Astro can compile**

Append this minimal export to `src/lib/qr-roulette.mjs`; Task 3 replaces its body test-first:

```js
export function initializeQrRoulette() {}
```

- [ ] **Step 6: Run the route test and verify it passes**

Run:

```bash
node --test --test-name-pattern="production build emits" tests/qr-roulette.test.mjs
```

Expected: 1 test PASS.

- [ ] **Step 7: Commit the static route**

```bash
git add src/components/QrWheel.astro src/pages/qr.astro src/lib/qr-roulette.mjs tests/qr-roulette.test.mjs
git commit -m "Add generated QR roulette route"
```

### Task 3: Spin and Prompt Interaction Controller

**Files:**
- Modify: `src/lib/qr-roulette.mjs`
- Modify: `tests/qr-roulette.test.mjs`

**Interfaces:**
- Consumes: the Task 2 DOM hooks and serialized categories.
- Produces: `initializeQrRoulette({ root, random?, reducedMotion?, schedule? })`, returning `{ spin, anotherPrompt, reset, getState }` for deterministic tests.

- [ ] **Step 1: Add a focused fake DOM and failing controller tests**

Append this test support and these tests to `tests/qr-roulette.test.mjs`:

```js
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
});
```

Also add `initializeQrRoulette` to the existing import list.

- [ ] **Step 2: Run controller tests and verify they fail against the empty controller**

Run:

```bash
node --test --test-name-pattern="spin locks|reduced motion|another prompt" tests/qr-roulette.test.mjs
```

Expected: FAIL because the returned controller is `undefined`.

- [ ] **Step 3: Implement the state controller**

Replace the temporary `initializeQrRoulette` export in `src/lib/qr-roulette.mjs` with:

```js
export function initializeQrRoulette(options = {}) {
  const root = options.root ?? document.querySelector('[data-qr-roulette]');
  if (!root) return null;

  const random = options.random ?? Math.random;
  const browserWindow = options.window ?? globalThis.window;
  const reducedMotion = options.reducedMotion
    ?? browserWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ?? false;
  const schedule = options.schedule ?? browserWindow.setTimeout.bind(browserWindow);
  const categories = validatePromptData({
    contentStatus: 'final',
    categories: JSON.parse(root.dataset.categories),
  });
  const elements = {
    wheel: root.querySelector('[data-wheel]'),
    spin: root.querySelector('[data-spin]'),
    result: root.querySelector('[data-result]'),
    category: root.querySelector('[data-result-category]'),
    prompt: root.querySelector('[data-result-prompt]'),
    announcement: root.querySelector('[data-announcement]'),
    another: root.querySelector('[data-another]'),
    reset: root.querySelector('[data-reset]'),
    error: root.querySelector('[data-error]'),
    segments: Array.from(root.querySelectorAll('[data-wheel-segment]')),
  };
  let state = 'ready';
  let selectedIndex = -1;
  let previousPrompt = '';
  let completedTurns = 0;

  function setState(nextState) {
    state = nextState;
    root.dataset.state = nextState;
  }

  function showResult() {
    const selected = categories[selectedIndex];
    previousPrompt = choosePrompt(selected.prompts, previousPrompt, random);
    elements.category.textContent = selected.category;
    elements.prompt.textContent = previousPrompt;
    elements.announcement.textContent = `${selected.category}. ${previousPrompt}`;
    elements.result.hidden = false;
    elements.spin.disabled = false;
    elements.segments.forEach((segment, index) => {
      segment.setAttribute('data-selected', String(index === selectedIndex));
    });
    setState('result');
  }

  function recover() {
    elements.error.hidden = false;
    elements.spin.disabled = false;
    setState('ready');
  }

  function spin() {
    if (state === 'spinning') return;
    try {
      elements.error.hidden = true;
      elements.result.hidden = true;
      elements.spin.disabled = true;
      selectedIndex = chooseIndex(categories.length, random);
      previousPrompt = '';
      completedTurns += 4;
      const sliceAngle = 360 / categories.length;
      const rotation = completedTurns * 360 - (selectedIndex + 0.5) * sliceAngle;
      elements.wheel.style.setProperty('--wheel-rotation', `${rotation}deg`);
      setState('spinning');
      schedule(() => {
        try {
          showResult();
        } catch {
          recover();
        }
      }, reducedMotion ? 80 : 2600);
    } catch {
      recover();
    }
  }

  function anotherPrompt() {
    if (selectedIndex < 0 || state !== 'result') return;
    showResult();
  }

  function reset() {
    elements.result.hidden = true;
    elements.spin.disabled = false;
    elements.announcement.textContent = '';
    elements.segments.forEach((segment) => segment.setAttribute('data-selected', 'false'));
    setState('ready');
  }

  elements.spin.addEventListener('click', spin);
  elements.another.addEventListener('click', anotherPrompt);
  elements.reset.addEventListener('click', reset);

  return { spin, anotherPrompt, reset, getState: () => state };
}
```

- [ ] **Step 4: Run all QR roulette unit tests**

Run:

```bash
node --test tests/qr-roulette.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 5: Commit the interaction controller**

```bash
git add src/lib/qr-roulette.mjs tests/qr-roulette.test.mjs
git commit -m "Add QR roulette interactions"
```

### Task 4: Phone-First A-to-C Visual Transition and Final Verification

**Files:**
- Modify: `src/components/QrWheel.astro`
- Modify: `tests/qr-roulette.test.mjs`

**Interfaces:**
- Consumes: `data-state="ready" | "spinning" | "result"`, `--wheel-rotation`, `data-selected`, and the semantic DOM hooks from Tasks 2 and 3.
- Produces: the approved Incognito-branded A-to-C mobile presentation, safe-area support, focus states, reduced-motion overrides, and wide-screen fallback.

- [ ] **Step 1: Add failing structural style and isolation checks**

Append to `tests/qr-roulette.test.mjs`:

```js
test('built QR page contains the phone-first transition and accessibility safeguards', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/qr/index.html', import.meta.url), 'utf8');

  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /env\(safe-area-inset-bottom\)/);
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
```

- [ ] **Step 2: Run the new style checks and verify the incomplete-style failure**

Run:

```bash
node --test --test-name-pattern="phone-first|do not advertise" tests/qr-roulette.test.mjs
```

Expected: the isolation check PASS and the phone-first check FAIL because final safe-area and reduced-motion styles are not present.

- [ ] **Step 3: Implement the approved visual system in scoped component CSS**

Complete the `<style>` block in `src/components/QrWheel.astro` with these required design rules:

```css
.qr-roulette {
  --qr-navy: #071526;
  --qr-blue: #155eef;
  --qr-pink: #ef3b8f;
  display: grid;
  min-height: 100svh;
  align-content: start;
  overflow: hidden;
  padding: max(1.25rem, env(safe-area-inset-top)) max(1.1rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1.1rem, env(safe-area-inset-left));
  background:
    linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px),
    var(--qr-navy);
  background-size: 42px 42px;
  color: #fff;
}

.qr-roulette__intro { position: relative; z-index: 2; width: min(100%, 34rem); margin-inline: auto; }
.qr-roulette__intro img { width: 9.5rem; filter: brightness(0) invert(1); }
.qr-roulette__eyebrow { margin-top: 1.35rem; color: #9ec4ff; font-size: .7rem; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
.qr-roulette__intro h1 { margin-top: .55rem; color: #fff; font-size: clamp(2.5rem, 12vw, 4.3rem); line-height: .82; text-transform: uppercase; }
.qr-roulette__intro h1 em { color: var(--qr-pink); font-style: normal; }
.qr-roulette__intro > p:last-child { max-width: 28rem; margin-top: .9rem; color: #cbd8e8; font-size: .92rem; line-height: 1.45; }

.qr-roulette__stage { position: relative; display: grid; width: min(100%, 34rem); min-height: 29rem; margin: 1.2rem auto 0; place-items: center; }
.qr-wheel-wrap { position: relative; display: grid; width: min(82vw, 22rem); aspect-ratio: 1; place-items: center; transition: width .55s cubic-bezier(.2,.75,.2,1), transform .55s cubic-bezier(.2,.75,.2,1); }
.qr-wheel { width: 100%; overflow: visible; border-radius: 50%; filter: drop-shadow(0 .75rem 0 rgba(0,0,0,.28)); transform: rotate(var(--wheel-rotation, 0deg)); transition: transform 2.6s cubic-bezier(.12,.72,.12,1); }
.qr-wheel path { stroke: var(--qr-navy); stroke-width: 3; }
.qr-wheel text { fill: #fff; font-family: var(--display); font-size: 11px; font-weight: 900; letter-spacing: .02em; pointer-events: none; text-transform: uppercase; }
.qr-pointer { position: absolute; z-index: 3; top: -.6rem; width: 0; height: 0; border-right: 1rem solid transparent; border-left: 1rem solid transparent; border-top: 2rem solid #fff; filter: drop-shadow(0 3px 0 var(--qr-navy)); }
.qr-spin { position: absolute; z-index: 4; display: grid; width: 5.6rem; aspect-ratio: 1; place-items: center; border: 4px solid var(--qr-navy); border-radius: 50%; background: #fff; color: var(--qr-navy); font-family: var(--display); font-size: 1.1rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 .35rem 0 var(--qr-navy); cursor: pointer; }
.qr-spin:active { transform: translateY(.2rem); box-shadow: 0 .15rem 0 var(--qr-navy); }
.qr-spin:disabled { cursor: wait; opacity: .82; }

.qr-result { z-index: 5; width: 100%; padding: 1.5rem 1.25rem max(1.35rem, env(safe-area-inset-bottom)); border-top: 5px solid var(--qr-pink); background: #fff; color: var(--qr-navy); box-shadow: 0 -1.2rem 3rem rgba(0,0,0,.28); }
.qr-result[hidden] { display: none; }
.qr-result__category { color: var(--qr-pink); font-size: .72rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.qr-result__prompt { margin-top: .75rem; font-family: var(--display); font-size: clamp(1.65rem, 8vw, 2.5rem); font-weight: 900; letter-spacing: -.035em; line-height: 1.05; }
.qr-result__actions { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-top: 1.35rem; }
.qr-result__actions button { min-height: 3.25rem; padding: .7rem; border: 2px solid var(--qr-navy); background: var(--qr-navy); color: #fff; font-size: .68rem; font-weight: 900; letter-spacing: .07em; text-transform: uppercase; }
.qr-result__actions button:last-child { background: transparent; color: var(--qr-navy); }
.qr-result__error { margin-top: .8rem; color: #a32929; font-size: .8rem; }
.sr-only { position: absolute; overflow: hidden; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; clip: rect(0 0 0 0); white-space: nowrap; }

.qr-roulette[data-state='result'] .qr-wheel-wrap { width: min(44vw, 12rem); transform: translateY(-.25rem); }
.qr-roulette[data-state='result'] .qr-result { animation: qr-result-rise .45s cubic-bezier(.2,.75,.2,1) both; }
.qr-roulette[data-state='result'] [data-wheel-segment][data-selected='false'] { opacity: .72; }
.qr-roulette[data-state='result'] [data-wheel-segment][data-selected='true'] path { stroke: #fff; stroke-width: 7; }

@keyframes qr-result-rise { from { opacity: 0; transform: translateY(2rem); } }

@media (min-width: 760px) {
  .qr-roulette { align-content: center; }
  .qr-roulette__stage { min-height: 34rem; }
  .qr-roulette[data-state='result'] .qr-roulette__stage { grid-template-columns: minmax(15rem, .8fr) minmax(20rem, 1.2fr); gap: 2rem; width: min(100%, 58rem); }
  .qr-roulette[data-state='result'] .qr-wheel-wrap { width: min(32vw, 20rem); }
  .qr-result { align-self: center; box-shadow: .7rem .7rem 0 var(--qr-blue); }
}

@media (prefers-reduced-motion: reduce) {
  .qr-wheel, .qr-wheel-wrap { transition-duration: .08s; }
  .qr-roulette[data-state='result'] .qr-result { animation-duration: .08s; }
}
```

Refine spacing around short-height phones with `@media (max-height: 700px)` by reducing heading margins and wheel width, without taking touch targets below 44 CSS pixels. Preserve the same selectors so the controller and tests remain stable.

- [ ] **Step 4: Run the QR tests and production build**

Run:

```bash
node --test tests/qr-roulette.test.mjs
npm run build
```

Expected: all QR tests PASS and Astro completes with `/qr/index.html` in the generated routes.

- [ ] **Step 5: Run the existing project tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all project tests PASS. If an existing unrelated dirty-worktree test fails, record its exact command and failure without altering the unrelated source files.

- [ ] **Step 6: Visually verify the real route**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Open `/qr` and verify these checkpoints in the browser:

- 320 × 568: no horizontal overflow; all controls remain at least 44 CSS pixels high.
- 390 × 844: the initial wheel is the visual focus; the result panel is readable without zooming.
- 768 × 1024 and 1440 × 900: the route remains centered and the result uses available width without becoming sparse.
- Keyboard: Tab reaches Spin, Another prompt, and Spin again with visible focus; Enter and Space activate them.
- Spin: repeated taps during animation do not create competing results.
- Result: the winning category and prompt match; Another prompt stays in that category; Spin again restores the large wheel.
- Reduced motion: the result arrives quickly without a long rotation.
- Site isolation: header and footer are absent, and no existing page links to `/qr`.

- [ ] **Step 7: Commit the finished mobile presentation**

```bash
git add src/components/QrWheel.astro tests/qr-roulette.test.mjs
git commit -m "Polish mobile QR roulette experience"
```

- [ ] **Step 8: Confirm the implementation diff is isolated**

Run:

```bash
git status --short
git diff --check HEAD~4..HEAD
git log --oneline -5
```

Expected: the four feature commits include only the five files listed under File Structure, while pre-existing unrelated workspace changes remain untouched.
