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

test('the revised directory preserves the corrected tutor data across 75 source listings', async () => {
  const tutors = await loadTutors();
  const anastasios = tutors?.find((tutor) => tutor.name === 'Anastasios Vlachmpeis');
  const isaac = tutors?.find((tutor) => tutor.name === 'Isaac Tighe');

  assert.equal(tutors?.length, 75);
  assert.equal(new Set(tutors?.map((tutor) => tutor.name)).size, 44);
  assert.equal(tutors?.every((tutor) => tutor.email && tutor.phone), true);
  assert.equal(anastasios?.courses.includes('DSA'), true);
  assert.equal(isaac?.phone, '+353873635314');
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

test('source listings merge into one tutor while courses retain every applicable year', async () => {
  const directory = await loadTutorDirectoryModule();
  const fixture = [
    {
      name: 'Ada Lovelace', email: 'ada@example.com', phone: '+31000000001', pay: '12',
      category: 'DSAI + CS YR 1', courses: ['Logic', 'Databases'],
    },
    {
      name: 'Ada Lovelace', email: 'ada@example.com', phone: '+31000000001', pay: '12',
      category: 'DSAI YR 2', courses: ['Databases', 'Machine Learning'],
    },
  ];

  assert.deepEqual(directory?.groupTutorListings(fixture), [{
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+31000000001',
    pay: '12',
    categories: ['DSAI + CS YR 1', 'DSAI YR 2'],
    courses: [
      { name: 'Logic', categories: ['DSAI + CS YR 1'] },
      { name: 'Databases', categories: ['DSAI + CS YR 1', 'DSAI YR 2'] },
      { name: 'Machine Learning', categories: ['DSAI YR 2'] },
    ],
  }]);
});

test('course selection defaults to all distinct courses and filters by year on request', async () => {
  const directory = await loadTutorDirectoryModule();
  const tutor = {
    courses: [
      { name: 'Logic', categories: ['DSAI + CS YR 1'] },
      { name: 'Databases', categories: ['DSAI + CS YR 1', 'DSAI YR 2'] },
      { name: 'Machine Learning', categories: ['DSAI YR 2'] },
    ],
  };

  assert.deepEqual(directory?.coursesForCategory(tutor, 'All').map((course) => course.name), [
    'Logic', 'Databases', 'Machine Learning',
  ]);
  assert.deepEqual(directory?.coursesForCategory(tutor, 'DSAI YR 2').map((course) => course.name), [
    'Databases', 'Machine Learning',
  ]);
});

test('directory filtering matches tutor names and tagged courses within the selected category', async () => {
  const directory = await loadTutorDirectoryModule();
  const fixture = directory?.groupTutorListings([
    { name: 'Ada Lovelace', email: 'ada@example.com', phone: '1', pay: '12', category: 'MASTER AI', courses: ['Machine Learning'] },
    { name: 'Grace Hopper', email: 'grace@example.com', phone: '2', pay: '12', category: 'CS YR 2', courses: ['Computer Networks'] },
    { name: 'Edsger Dijkstra', email: 'edsger@example.com', phone: '3', pay: '12', category: 'CS YR 2', courses: ['Algorithms'] },
  ]);

  assert.deepEqual(directory?.filterTutors(fixture, { category: 'CS YR 2', query: 'networks' }), [fixture?.[1]]);
  assert.deepEqual(directory?.filterTutors(fixture, { category: 'All', query: 'ada' }), [fixture?.[0]]);
});

test('directory sorting orders by name or by descending course count', async () => {
  const directory = await loadTutorDirectoryModule();
  const fixture = [
    { name: 'Zara', courses: [{ name: 'One', categories: ['Year 1'] }] },
    { name: 'Alex', courses: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }] },
    { name: 'Mo', courses: [{ name: 'One' }, { name: 'Two' }] },
  ];

  assert.deepEqual(directory?.sortTutors(fixture, 'name').map((tutor) => tutor.name), ['Alex', 'Mo', 'Zara']);
  assert.deepEqual(directory?.sortTutors(fixture, 'courses').map((tutor) => tutor.name), ['Alex', 'Mo', 'Zara']);
  assert.deepEqual(fixture.map((tutor) => tutor.name), ['Zara', 'Alex', 'Mo'], 'sorting must not mutate source data');
});

test('result counts describe unique tutors rather than source listings', async () => {
  const directory = await loadTutorDirectoryModule();

  assert.equal(directory?.tutorCountLabel(44), '44 tutors found');
  assert.equal(directory?.tutorCountLabel(1), '1 tutor found');
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
  assert.equal((html.match(/<article[^>]*data-tutor-card/g) ?? []).length, 44);
  assert.equal((html.match(/data-course-filter="All"/g) ?? []).length, 44);
  assert.match(html, /44 tutors found/);
  assert.doesNotMatch(html, /tel:/);
  assert.doesNotMatch(html, /student\.maastrichtuniversity\.nl/);
  assert.match(homepage, /href="\/tutors"[^>]*><span>01<\/span><strong>Find a tutor<\/strong>/);
  assert.match(headers, /\/tutors\*\s+X-Robots-Tag: noindex, nofollow, noarchive, nosnippet/);

  const stylesheetPath = html.match(/href="(\/_astro\/tutors\.[^"]+\.css)"/)?.[1];
  assert.ok(stylesheetPath, 'the tutor stylesheet should be linked');
  const stylesheet = await readFile(new URL(`../dist${stylesheetPath}`, import.meta.url), 'utf8');
  assert.match(stylesheet, /\.tutor-contact-link\{display:grid/);
  assert.match(stylesheet, /\.tutor-contact-label\{/);
});
