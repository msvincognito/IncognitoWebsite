import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadTutorDirectoryModule() {
  try {
    return await import('../src/lib/tutor-directory.mjs');
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return null;
    throw error;
  }
}

async function loadTutors() {
  try {
    const source = await readFile(new URL('../src/data/tutors.json', import.meta.url), 'utf8');
    return JSON.parse(source);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

test('the revised directory contains 44 contactable tutors across 75 listings', async () => {
  const tutors = await loadTutors();

  assert.equal(tutors?.length, 75);
  assert.equal(new Set(tutors?.map((tutor) => tutor.name)).size, 44);
  assert.equal(tutors?.every((tutor) => tutor.email && tutor.phone), true);
  assert.deepEqual(
    Object.fromEntries(
      ['DSAI + CS YR 1', 'DSAI YR 2', 'CS YR 2', 'DSAI + CS YR 3', 'MASTER DSDM', 'MASTER AI']
        .map((category) => [category, tutors?.filter((tutor) => tutor.category === category).length]),
    ),
    {
      'DSAI + CS YR 1': 44,
      'DSAI YR 2': 11,
      'CS YR 2': 15,
      'DSAI + CS YR 3': 3,
      'MASTER DSDM': 1,
      'MASTER AI': 1,
    },
  );
});

test('directory filtering matches names and courses within the selected category', async () => {
  const directory = await loadTutorDirectoryModule();
  const fixture = [
    { name: 'Ada Lovelace', category: 'MASTER AI', courses: ['Machine Learning'] },
    { name: 'Grace Hopper', category: 'CS YR 2', courses: ['Computer Networks'] },
    { name: 'Edsger Dijkstra', category: 'CS YR 2', courses: ['Algorithms'] },
  ];

  assert.deepEqual(
    directory?.filterTutors(fixture, { category: 'CS YR 2', query: 'networks' }),
    [fixture[1]],
  );
  assert.deepEqual(
    directory?.filterTutors(fixture, { category: 'All', query: 'ada' }),
    [fixture[0]],
  );
});

test('directory sorting orders by name or by descending course count', async () => {
  const directory = await loadTutorDirectoryModule();
  const fixture = [
    { name: 'Zara', courses: ['One'] },
    { name: 'Alex', courses: ['One', 'Two', 'Three'] },
    { name: 'Mo', courses: ['One', 'Two'] },
  ];

  assert.deepEqual(directory?.sortTutors(fixture, 'name').map((tutor) => tutor.name), ['Alex', 'Mo', 'Zara']);
  assert.deepEqual(directory?.sortTutors(fixture, 'courses').map((tutor) => tutor.name), ['Alex', 'Mo', 'Zara']);
  assert.deepEqual(fixture.map((tutor) => tutor.name), ['Zara', 'Alex', 'Mo'], 'sorting must not mutate source data');
});

test('contact links normalize addresses without changing their displayed values', async () => {
  const directory = await loadTutorDirectoryModule();

  assert.deepEqual(
    directory?.contactLinks({ email: 'Tutor.Name@example.com', phone: '+31 6 12 34 56 78 (WhatsApp only)' }),
    {
      email: 'mailto:Tutor.Name@example.com',
      phone: 'tel:+31612345678',
    },
  );
});

test('the production build emits an unindexed directory without contacts in its HTML', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const pageUrl = new URL('../dist/tutors/index.html', import.meta.url);
  let routeExists = true;
  try {
    await access(pageUrl);
  } catch {
    routeExists = false;
  }

  assert.equal(routeExists, true, '/tutors should be generated');

  const [html, homepage, headers] = await Promise.all([
    readFile(pageUrl, 'utf8'),
    readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../dist/_headers', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/);
  assert.match(html, /data-tutor-directory/);
  assert.match(html, /Show contact/);
  assert.doesNotMatch(html, /tel:/);
  assert.doesNotMatch(html, /student\.maastrichtuniversity\.nl/);
  assert.match(homepage, /href="\/tutors"[^>]*><span>01<\/span><strong>Find a tutor<\/strong>/);
  assert.match(headers, /\/tutors\*\s+X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);
});
