# Matomo Consent Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate cookieless Matomo tracking behind an accessible, identity-preserving consent banner on every public website route.

**Architecture:** A dependency-free client controller in `public/matomo-consent.js` owns consent persistence, UI state, and idempotent Matomo initialization. `BaseLayout.astro` loads it once on every route, while a focused component block in `global.css` adapts the wiki banner to the website's square editorial design system.

**Tech Stack:** Astro 5, browser JavaScript, CSS, Node.js built-in test runner

## Global Constraints

- Use storage key `incognito.analytics-consent.v1` with only `accepted` and `declined` as valid values.
- Do not load Matomo or queue a page view before acceptance.
- After acceptance, call `requireConsent`, `disableCookies`, and `setConsentGiven`, then configure `https://analytics.msvincognito.nl/matomo.php` with site ID `1`.
- Load `https://analytics.msvincognito.nl/matomo.js` asynchronously exactly once, queue exactly one current-document page view, and enable link tracking.
- Keep acceptance and refusal equally accessible; link to `/privacy-policy`; leave a persistent `Privacy settings` control after either decision.
- Preserve operation when local storage or the analytics host is unavailable.
- Make controller execution idempotent and avoid cross-subdomain cookies or third-party dependencies.
- Match the website's square geometry, condensed display typography, uppercase labels, navy panel, blue-to-purple-to-pink rule, and pink focus treatment.
- Respect safe-area insets, narrow viewports, both website themes, and reduced-motion preferences.
- This plan supersedes `docs/superpowers/plans/2026-08-15-matomo-tracking.md`.

---

### Task 1: Consent controller behavior

**Files:**
- Create: `public/matomo-consent.js`
- Create: `tests/matomo-consent.test.mjs`

**Interfaces:**
- Consumes: `window.localStorage`, `window._paq`, and the browser `document` DOM API.
- Produces: `window.__incognitoMatomoConsentController`, `window.__incognitoMatomoInitialized`, `#incognito-analytics-consent`, `#incognito-privacy-settings`, and the Matomo `_paq` command queue.

- [x] **Step 1: Write the minimal browser harness and first-visit failing test**

Create a dependency-free test harness that evaluates `public/matomo-consent.js` with `vm.runInNewContext`. The harness must provide real stateful fakes for elements, event listeners, focus, `document.head`, `document.body`, `createElement`, `getElementById`, and local storage. Start with this observable behavior:

```js
test('first visit asks for consent without loading Matomo', async () => {
  const browser = await runConsentController();

  assert.equal(browser.element('incognito-analytics-consent').hidden, false);
  assert.equal(browser.element('incognito-privacy-settings').hidden, true);
  assert.equal(browser.element('incognito-matomo-script'), null);
  assert.equal(browser.window._paq, undefined);
});
```

The change that makes this test pass is the controller creating the UI while leaving analytics uninitialized.

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/matomo-consent.test.mjs
```

Expected: FAIL because `public/matomo-consent.js` does not exist.

- [x] **Step 3: Implement the minimal first-visit controller**

Use a guarded IIFE:

```js
(function initializeAnalyticsConsent(window, document) {
  'use strict';

  if (window.__incognitoMatomoConsentController) return;
  window.__incognitoMatomoConsentController = true;

  // Create the labelled consent section, Allow analytics and Decline buttons,
  // privacy-policy link, actions wrapper, and Privacy settings button.
  // Append both top-level controls to document.body and show only the banner.
})(window, document);
```

The banner copy is exactly:

```html
<p class="incognito-consent-eyebrow">Your privacy</p>
<h2 id="incognito-analytics-consent-title">Privacy-friendly analytics</h2>
<p id="incognito-analytics-consent-description">We use cookieless Matomo analytics to understand how this website is used. Nothing is sent unless you allow it, and you can change your choice at any time.</p>
<a href="/privacy-policy">Read our privacy policy</a>
```

- [x] **Step 4: Verify the first-visit test passes**

Run `node --test tests/matomo-consent.test.mjs`.

Expected: PASS.

- [x] **Step 5: Add failing decision and tracking tests**

Add separate tests asserting:

```js
test('acceptance persists and initializes cookieless Matomo exactly once', async () => {
  const browser = await runConsentController();
  browser.click('incognito-analytics-accept');

  assert.equal(browser.storage.get('incognito.analytics-consent.v1'), 'accepted');
  assert.deepEqual(normalize(browser.window._paq), [
    ['requireConsent'],
    ['disableCookies'],
    ['setConsentGiven'],
    ['setTrackerUrl', 'https://analytics.msvincognito.nl/matomo.php'],
    ['setSiteId', '1'],
    ['trackPageView'],
    ['enableLinkTracking'],
  ]);
  assert.equal(browser.scripts('incognito-matomo-script').length, 1);
});

test('refusal persists without initializing Matomo', async () => {
  const browser = await runConsentController();
  browser.click('incognito-analytics-decline');

  assert.equal(browser.storage.get('incognito.analytics-consent.v1'), 'declined');
  assert.equal(browser.window._paq, undefined);
  assert.equal(browser.element('incognito-analytics-consent').hidden, true);
  assert.equal(browser.element('incognito-privacy-settings').hidden, false);
});
```

Add cases for stored acceptance, stored refusal, invalid stored values, unavailable local storage, settings reopening with focus, accepted-to-declined consent withdrawal, declined-to-accepted initialization, and evaluating the controller twice without duplicate UI, scripts, or page views.

The change that makes these tests pass is valid decision persistence plus idempotent Matomo and UI state transitions.

- [x] **Step 6: Run decision tests and verify RED**

Run `node --test tests/matomo-consent.test.mjs`.

Expected: the first-visit test passes; the new decision tests FAIL because their event behavior is not implemented.

- [x] **Step 7: Implement persistence, state transitions, and Matomo initialization**

Implement these exact internal functions in the controller:

```js
function readDecision() { /* return accepted, declined, or null; catch storage errors */ }
function writeDecision(value) { /* persist value; catch storage errors */ }
function initializeMatomo() { /* idempotently queue consent/cookieless config and append async script */ }
function showBanner(moveFocus) { /* show banner, hide settings, optionally focus accept */ }
function hideBanner(restoreFocus) { /* hide banner, show settings, optionally focus settings */ }
```

Acceptance writes `accepted`, initializes Matomo only if needed, and hides the banner. Refusal writes `declined`, queues `forgetConsentGiven` and `deleteCookies` only when `_paq` exists, and hides the banner. Stored acceptance initializes on load; stored refusal does not. A settings click reopens the banner. Event handlers ignore clicks while their control is hidden.

- [x] **Step 8: Run focused tests and verify GREEN**

Run `node --test tests/matomo-consent.test.mjs`.

Expected: all consent-controller tests PASS with no warnings.

- [x] **Step 9: Commit the behavior**

```bash
git add public/matomo-consent.js tests/matomo-consent.test.mjs
git commit -m "Add privacy-first Matomo consent controller"
```

---

### Task 2: Site-wide integration and adapted visual identity

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`
- Modify: `tests/matomo-consent.test.mjs`

**Interfaces:**
- Consumes: `/matomo-consent.js` and the IDs/classes rendered by Task 1.
- Produces: one deferred consent controller on every generated page and a responsive banner using existing CSS custom properties.

- [x] **Step 1: Add a failing generated-output integration test**

Build the site from the test with `execFileSync('npm', ['run', 'build'])`, then inspect these representative pages:

```js
const generatedPages = [
  'dist/index.html',
  'dist/about/index.html',
  'dist/intro-camp-2026-terms-of-service/index.html',
  'dist/404.html',
];

test('every generated route loads one deferred consent controller', async () => {
  for (const pagePath of generatedPages) {
    const html = await readFile(new URL(`../${pagePath}`, import.meta.url), 'utf8');
    assert.equal((html.match(/<script src="\/matomo-consent\.js" defer><\/script>/g) || []).length, 1);
    assert.doesNotMatch(html, /analytics\.msvincognito\.nl\/matomo\.js/);
  }
});
```

The change that makes this test pass is the shared layout loading the controller once without embedding Matomo directly.

- [x] **Step 2: Run the integration test and verify RED**

Run `node --test tests/matomo-consent.test.mjs`.

Expected: FAIL because generated pages do not load `/matomo-consent.js`.

- [x] **Step 3: Load the controller from the shared layout**

Add this before `</head>` in `src/layouts/BaseLayout.astro`:

```astro
<script src="/matomo-consent.js" defer></script>
```

Do not add an inline Matomo bootstrap.

- [x] **Step 4: Add the adapted component styles**

In the components layer, style the banner with:

- fixed bottom-centered positioning, `width: min(900px, calc(100% - 32px))`, safe-area offsets, and `z-index: 1000`;
- `background: #10253d`, white text, a one-pixel blue border, a restrained shadow, and a gradient top rule;
- a two-column desktop grid for copy/actions and one-column layout below 620px;
- display typography for the heading, uppercase condensed labels, square buttons, pink focus outlines, and distinct primary/outlined actions;
- `[hidden] { display: none; }` rules for both top-level controls;
- a square, fixed privacy-settings control at the lower-right; and
- opacity/transform transitions that are neutralized by the existing reduced-motion rule.

All repeated colors, fonts, and focus styles must use existing website variables where contrast permits. Do not add rounded corners, backdrop blur, or glass effects.

- [x] **Step 5: Rebuild and verify integration GREEN**

Run:

```bash
npm run build
node --test tests/matomo-consent.test.mjs
```

Expected: the build and all focused tests PASS without warnings.

- [x] **Step 6: Inspect representative output and responsive CSS**

Verify the generated homepage contains exactly one controller reference and no direct Matomo reference:

```bash
rg -o '<script src="/matomo-consent\.js" defer></script>' dist/index.html
rg -n 'analytics\.msvincognito\.nl/matomo\.js' dist/index.html
```

Expected: the first command prints one match; the second prints none. Inspect desktop and mobile renderings in light and dark themes, including focus visibility and overflow.

- [x] **Step 7: Commit the integration and styling**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css tests/matomo-consent.test.mjs
git commit -m "Integrate branded analytics consent banner"
```

---

### Task 3: Final verification and documentation alignment

**Files:**
- Modify: `docs/superpowers/plans/2026-08-16-matomo-consent-banner.md`

**Interfaces:**
- Consumes: the completed controller, layout integration, styles, and test suite.
- Produces: checked plan state and a verified, push-ready branch.

- [x] **Step 1: Run the complete verification suite**

Run:

```bash
npm run build
node --test tests/matomo-consent.test.mjs
git diff --check
```

Expected: build succeeds, every test passes, and `git diff --check` reports no errors.

- [x] **Step 2: Mark completed plan checkboxes and commit**

Update every completed checkbox in this plan from `[ ]` to `[x]`, then run:

```bash
git add docs/superpowers/plans/2026-08-16-matomo-consent-banner.md
git commit -m "Complete Matomo consent banner plan"
```

- [x] **Step 3: Push the current branch**

Run `git push` and report the pushed branch and final verification results.
