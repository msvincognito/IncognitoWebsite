import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadIntroDaysModule() {
  try {
    return await import('../public/intro-days.js');
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

test('intro days exposes browser behavior for a live year and programme query', async () => {
  const introDays = await loadIntroDaysModule();

  assert.equal(typeof introDays?.initializeIntroDays, 'function');
});

function createPageElements() {
  const elements = new Map([
    ['intro-days-year', { textContent: '' }],
    ['intro-days-programme', { hidden: true }],
    ['intro-days-programme-name', { textContent: '' }],
    ['intro-days-programme-link', { href: '' }],
  ]);

  return {
    document: {
      getElementById(id) {
        return elements.get(id) ?? null;
      },
    },
    element(id) {
      return elements.get(id);
    },
  };
}

test('header displays the current and next year as an academic year range', async () => {
  const { initializeIntroDays } = await loadIntroDaysModule();
  const page = createPageElements();

  initializeIntroDays({ document: page.document, search: '', currentYear: 2026 });

  assert.equal(page.element('intro-days-year').textContent, '2026-2027');
});

test('valid programme queries reveal the matching named WhatsApp group', async () => {
  const { initializeIntroDays } = await loadIntroDaysModule();
  const cases = [
    {
      search: '?programme=dsai',
      name: 'Data Science and Artificial Intelligence',
      href: 'https://chat.whatsapp.com/CU0IbvOKC6E2RZZ55epVad?s=cl&p=i&ilr=4',
    },
    {
      search: '?programme=cs',
      name: 'Computer Science',
      href: 'https://chat.whatsapp.com/Hmu4jTXU3CE6zs8NWdxrPk?s=cl&p=i&ilr=4',
    },
    {
      search: '?programme=masters',
      name: 'Master’s students',
      href: 'https://chat.whatsapp.com/JwHNjVq5OApCpOgQOuAZvQ?s=cl&p=i&ilr=4',
    },
  ];

  for (const expected of cases) {
    const page = createPageElements();
    initializeIntroDays({
      document: page.document,
      search: expected.search,
      currentYear: 2026,
    });

    assert.equal(page.element('intro-days-programme').hidden, false);
    assert.equal(page.element('intro-days-programme-name').textContent, expected.name);
    assert.equal(page.element('intro-days-programme-link').href, expected.href);
  }
});

test('missing and invalid programme queries keep the WhatsApp section hidden', async () => {
  const { initializeIntroDays } = await loadIntroDaysModule();

  for (const search of ['', '?programme=', '?programme=unknown', '?program=cs']) {
    const page = createPageElements();
    initializeIntroDays({ document: page.document, search, currentYear: 2026 });

    assert.equal(page.element('intro-days-programme').hidden, true);
    assert.equal(page.element('intro-days-programme-link').href, '');
  }
});

test('the production build generates the unlisted intro days resource page', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const pageUrl = new URL('../dist/intro-days/index.html', import.meta.url);
  let routeExists = true;
  try {
    await access(pageUrl);
  } catch {
    routeExists = false;
  }

  assert.equal(routeExists, true, '/intro-days should be generated');

  const html = await readFile(pageUrl, 'utf8');
  assert.match(html, /id="intro-days-year"/);
  assert.match(html, /id="intro-days-programme"[^>]*hidden/);
  assert.match(html, /src="\/intro-days\.js"/);
  assert.match(html, /Register with a GP/);
  assert.match(html, /Student Portal/);
  assert.match(html, /Incognito Presentation/);
});
