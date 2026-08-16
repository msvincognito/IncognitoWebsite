import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

class FakeElement {
  constructor(tagName, document) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = document;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.hidden = false;
    this.parentNode = null;
    this.textContent = '';
  }

  set id(value) {
    this._id = value;
    this.ownerDocument.elements.set(value, this);
  }

  get id() {
    return this._id || '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click() {
    for (const listener of this.listeners.get('click') || []) {
      listener.call(this, { currentTarget: this, target: this });
    }
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }
}

function createBrowser(options = {}) {
  const document = {
    activeElement: null,
    elements: new Map(),
    createElement(tagName) {
      return new FakeElement(tagName, document);
    },
    getElementById(id) {
      return document.elements.get(id) || null;
    },
  };
  document.head = document.createElement('head');
  document.body = document.createElement('body');

  const storage = new Map(options.storage);
  const window = {
    localStorage: {
      getItem(key) {
        if (options.storageThrows) throw new Error('Storage unavailable');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (options.storageThrows) throw new Error('Storage unavailable');
        storage.set(key, String(value));
      },
    },
  };

  return {
    click(id) {
      document.getElementById(id)?.click();
    },
    document,
    element: (id) => document.getElementById(id),
    scripts(id) {
      return document.head.children.filter((element) => element.id === id);
    },
    storage,
    window,
  };
}

async function evaluateConsentController(browser) {
  const source = await readFile(new URL('../public/matomo-consent.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, {
    document: browser.document,
    window: browser.window,
  });
}

async function runConsentController(options) {
  const browser = createBrowser(options);
  await evaluateConsentController(browser);
  return browser;
}

function normalizeQueue(queue) {
  return Array.from(queue, (command) => Array.from(command));
}

test('first visit asks for consent without loading Matomo', async () => {
  const browser = await runConsentController();

  assert.equal(browser.element('incognito-analytics-consent').hidden, false);
  assert.equal(browser.element('incognito-privacy-settings').hidden, true);
  assert.equal(browser.element('incognito-matomo-script'), null);
  assert.equal(browser.window._paq, undefined);
});

test('acceptance persists and initializes cookieless Matomo exactly once', async () => {
  const browser = await runConsentController();
  browser.click('incognito-analytics-accept');

  assert.equal(browser.storage.get('incognito.analytics-consent.v1'), 'accepted');
  assert.deepEqual(normalizeQueue(browser.window._paq), [
    ['requireConsent'],
    ['disableCookies'],
    ['setConsentGiven'],
    ['setTrackerUrl', 'https://analytics.msvincognito.nl/matomo.php'],
    ['setSiteId', '1'],
    ['trackPageView'],
    ['enableLinkTracking'],
  ]);
  assert.equal(browser.scripts('incognito-matomo-script').length, 1);
  assert.equal(browser.scripts('incognito-matomo-script')[0].async, true);
  assert.equal(browser.scripts('incognito-matomo-script')[0].src, 'https://analytics.msvincognito.nl/matomo.js');
  assert.equal(browser.element('incognito-analytics-consent').hidden, true);
  assert.equal(browser.element('incognito-privacy-settings').hidden, false);
});

test('refusal persists without initializing Matomo', async () => {
  const browser = await runConsentController();
  browser.click('incognito-analytics-decline');

  assert.equal(browser.storage.get('incognito.analytics-consent.v1'), 'declined');
  assert.equal(browser.window._paq, undefined);
  assert.equal(browser.element('incognito-analytics-consent').hidden, true);
  assert.equal(browser.element('incognito-privacy-settings').hidden, false);
});

test('stored acceptance initializes Matomo while stored refusal leaves it unloaded', async () => {
  const acceptedBrowser = await runConsentController({
    storage: [['incognito.analytics-consent.v1', 'accepted']],
  });
  const declinedBrowser = await runConsentController({
    storage: [['incognito.analytics-consent.v1', 'declined']],
  });

  assert.equal(acceptedBrowser.scripts('incognito-matomo-script').length, 1);
  assert.equal(normalizeQueue(acceptedBrowser.window._paq).filter(([command]) => command === 'trackPageView').length, 1);
  assert.equal(acceptedBrowser.element('incognito-analytics-consent').hidden, true);
  assert.equal(declinedBrowser.window._paq, undefined);
  assert.equal(declinedBrowser.element('incognito-analytics-consent').hidden, true);
  assert.equal(declinedBrowser.element('incognito-privacy-settings').hidden, false);
});

test('invalid or unavailable storage behaves like a first visit', async () => {
  const invalidBrowser = await runConsentController({
    storage: [['incognito.analytics-consent.v1', 'maybe']],
  });
  const unavailableBrowser = await runConsentController({ storageThrows: true });

  assert.equal(invalidBrowser.element('incognito-analytics-consent').hidden, false);
  assert.equal(invalidBrowser.window._paq, undefined);
  assert.equal(unavailableBrowser.element('incognito-analytics-consent').hidden, false);
  unavailableBrowser.click('incognito-analytics-accept');
  assert.equal(unavailableBrowser.scripts('incognito-matomo-script').length, 1);
});

test('privacy settings reopens the banner and restores focus after a decision', async () => {
  const browser = await runConsentController();
  browser.click('incognito-analytics-decline');

  assert.equal(browser.document.activeElement.id, 'incognito-privacy-settings');
  browser.click('incognito-privacy-settings');
  assert.equal(browser.element('incognito-analytics-consent').hidden, false);
  assert.equal(browser.element('incognito-privacy-settings').hidden, true);
  assert.equal(browser.document.activeElement.id, 'incognito-analytics-accept');
});

test('withdrawing and restoring consent does not duplicate the current page view', async () => {
  const browser = await runConsentController({
    storage: [['incognito.analytics-consent.v1', 'accepted']],
  });
  browser.click('incognito-privacy-settings');
  browser.click('incognito-analytics-decline');

  assert.deepEqual(normalizeQueue(browser.window._paq).slice(-2), [
    ['forgetConsentGiven'],
    ['deleteCookies'],
  ]);
  browser.click('incognito-privacy-settings');
  browser.click('incognito-analytics-accept');

  const queue = normalizeQueue(browser.window._paq);
  assert.equal(queue.filter(([command]) => command === 'trackPageView').length, 1);
  assert.deepEqual(queue.at(-1), ['setConsentGiven']);
  assert.equal(browser.scripts('incognito-matomo-script').length, 1);
});

test('evaluating the controller twice does not duplicate UI or tracking', async () => {
  const browser = await runConsentController({
    storage: [['incognito.analytics-consent.v1', 'accepted']],
  });
  await evaluateConsentController(browser);

  assert.equal(browser.document.body.children.filter((element) => element.id === 'incognito-analytics-consent').length, 1);
  assert.equal(browser.document.body.children.filter((element) => element.id === 'incognito-privacy-settings').length, 1);
  assert.equal(browser.scripts('incognito-matomo-script').length, 1);
  assert.equal(normalizeQueue(browser.window._paq).filter(([command]) => command === 'trackPageView').length, 1);
});

test('every generated route loads one deferred consent controller', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const generatedPages = [
    'dist/index.html',
    'dist/about/index.html',
    'dist/intro-camp-2026-terms-of-service/index.html',
    'dist/404.html',
  ];

  for (const pagePath of generatedPages) {
    const html = await readFile(new URL(`../${pagePath}`, import.meta.url), 'utf8');
    const controllerScripts = html.match(/<script src="\/matomo-consent\.js" defer><\/script>/g) || [];
    assert.equal(controllerScripts.length, 1, `${pagePath} should load one consent controller`);
    assert.doesNotMatch(html, /analytics\.msvincognito\.nl\/matomo\.js/);
  }
});
