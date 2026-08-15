# Matomo Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load the supplied Matomo tracker exactly once on every website route.

**Architecture:** Keep analytics in the existing shared Astro layout so each statically generated document initializes Matomo once during a normal page load. A focused Node test executes the tracker from generated HTML against a minimal browser-like document and asserts the resulting Matomo queue and asynchronous script insertion across representative output pages.

**Tech Stack:** Astro 5, inline browser JavaScript, Node.js built-in test runner

## Global Constraints

- Track every route using `src/layouts/BaseLayout.astro`, including the homepage, content routes, legal route, and 404 page.
- Use Matomo host `//analytics.msvincognito.nl/` and site ID `1`.
- Record one page view per document load and enable link tracking.
- Do not add SPA route listeners, cookie-consent behavior, cookie-disabling behavior, environment gating, or a third-party analytics dependency.
- Load the external Matomo script asynchronously so analytics failure cannot block page rendering.

---

### Task 1: Site-wide Matomo tracking

**Files:**
- Create: `tests/matomo-tracking.test.mjs`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: The existing `BaseLayout` shared by all public Astro routes and Matomo's asynchronous `_paq` JavaScript API.
- Produces: One inline Matomo bootstrap in the shared layout configured for `//analytics.msvincognito.nl/` and site ID `1`.

- [ ] **Step 1: Write the failing generated-output regression test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const generatedPages = [
  'dist/index.html',
  'dist/about/index.html',
  'dist/intro-camp-2026-terms-of-service/index.html',
  'dist/404.html',
];

test('generated pages initialize the configured Matomo tracker exactly once', async () => {
  for (const pagePath of generatedPages) {
    const html = await readFile(new URL(`../${pagePath}`, import.meta.url), 'utf8');
    const snippets = [...html.matchAll(/<!-- Matomo --><script>([\s\S]*?)<\/script><!-- End Matomo Code -->/g)];
    assert.equal(snippets.length, 1, `${pagePath} should contain one Matomo bootstrap`);

    const insertedScripts = [];
    const firstScript = {
      parentNode: {
        insertBefore(script) {
          insertedScripts.push(script);
        },
      },
    };
    const context = {
      window: {},
      document: {
        createElement: () => ({}),
        getElementsByTagName: () => [firstScript],
      },
    };

    vm.runInNewContext(snippets[0][1], context);

    assert.deepEqual(
      Array.from(context.window._paq, (command) => Array.from(command)),
      [
        ['trackPageView'],
        ['enableLinkTracking'],
        ['setTrackerUrl', '//analytics.msvincognito.nl/matomo.php'],
        ['setSiteId', '1'],
      ],
    );
    assert.equal(insertedScripts.length, 1);
    assert.equal(insertedScripts[0].async, true);
    assert.equal(insertedScripts[0].src, '//analytics.msvincognito.nl/matomo.js');
  }
});
```

- [ ] **Step 2: Build, then run the focused test and verify the missing integration causes failure**

Run each command separately:

```bash
npm run build
node --test tests/matomo-tracking.test.mjs
```

Expected: the build passes, then the test FAILS because each generated page lacks a Matomo bootstrap.

- [ ] **Step 3: Add the minimal Matomo bootstrap to the shared layout**

Insert this markup inside `<head>` in `src/layouts/BaseLayout.astro`, before the closing `</head>`:

```astro
    <!-- Matomo -->
    <script is:inline>
      var _paq = window._paq = window._paq || [];
      /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="//analytics.msvincognito.nl/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '1']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    </script>
    <!-- End Matomo Code -->
```

- [ ] **Step 4: Rebuild and run the focused test to verify it passes**

Run each command separately:

```bash
npm run build
node --test tests/matomo-tracking.test.mjs
```

Expected: one passing test and no failures.

- [ ] **Step 5: Commit the implementation**

```bash
git add tests/matomo-tracking.test.mjs src/layouts/BaseLayout.astro
git commit -m "Add site-wide Matomo tracking"
```
