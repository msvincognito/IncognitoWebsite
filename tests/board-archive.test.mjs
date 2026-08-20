import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('the generated board archive preserves every recorded board back to the founding year', async () => {
  execFileSync('npm', ['run', 'build'], {
    cwd: new URL('..', import.meta.url),
    stdio: 'pipe',
  });

  const html = await readFile(new URL('../dist/board/index.html', import.meta.url), 'utf8');
  const expectedBoards = [
    ['31st Board', '2024–2025'],
    ['30th Board', '2023–2024'],
    ['29th Board', '2022–2023'],
    ['28th Board', '2021–2022'],
    ['27th Board', '2020–2021'],
    ['26th Board', '2019–2020'],
    ['25th Board', '2018–2019'],
    ['24th Board', '2017–2018'],
    ['23rd Board', '2016–2017'],
    ['22nd Board', '2015–2016'],
    ['21st Board', '2014–2015'],
    ['20th Board', '2013–2014'],
    ['19th Board', '2012–2013'],
    ['18th Board', '2011–2012'],
    ['17th Board', '2010–2011'],
    ['16th Board', '2009–2010'],
    ['15th Board', '2008–2009'],
    ['14th Board', '2007–2008'],
    ['13th Board', '2006–2007'],
    ['12th Board', '2005–2006'],
    ['11th Board', '2004–2005'],
    ['10th Board', '2003–2004'],
    ['9th Board', '2002–2003'],
    ['8th Board', '2001–2002'],
    ['7th Board', '2000–2001'],
    ['6th Board', '1999–2000'],
    ['5th Board', '1998–1999'],
    ['4th Board', '1997–1998'],
    ['3rd Board', '1996–1997'],
    ['2nd Board', '1995–1996'],
    ['1st Board', '1994–1995'],
  ];

  for (const [board, year] of expectedBoards) {
    assert.match(html, new RegExp(`${board}[^<]*·[^<]*${year}`), `${board} should include ${year}`);
  }

  const historicalMembers = [
    ['Bobby Slavchev', 'President'],
    ['Paul Dibeschl', 'Secretary &amp; IT Commissioner'],
    ['Sidney Jacobs', 'President'],
    ['Valentin Calomme', 'President &amp; External Commissioner'],
    ['Stan Kerstjens', 'Treasurer'],
    ['Gabi Ras', 'Chairman'],
    ['Job Hartjes', 'Chairman'],
    ['Nadine Barth', 'President'],
    ['Gijs-Jan Roelofs', 'President'],
    ['Daan Bloembergen', 'President'],
    ['Sander Arts', 'President'],
    ['Jeroen de Haas', 'President'],
    ['Frans van Egdom', 'President &amp; Secretary'],
    ['Jouke Hunfeld', 'Chairman'],
    ['Jeroen Lanslots', 'President'],
    ['Marcel van Beek', 'Chairman'],
  ];

  for (const [name, role] of historicalMembers) {
    assert.match(html, new RegExp(`${name}[\\s\\S]{0,200}${role}`), `${name} should retain the recorded role ${role}`);
  }

  assert.match(
    html,
    /<td>Ella Noomen<\/td><td>Treasurer<\/td>/,
    'members missing from a photograph should still appear in the board table',
  );

  const expectedPhotos = [
    'board2018-2019.jpg',
    'board2017-2018.jpg',
    'board2015-2016.png',
    'board2013-2014.jpg',
    'board2012-2013.jpg',
    'board2016-2017.jpg',
    'board2011-2012.jpg',
    'board2010-2011.jpg',
    'board2007-2008.png',
    'board2006-2007.png',
  ];

  for (const filename of expectedPhotos) {
    assert.match(html, new RegExp(`/assets/boards/${filename}`));
    await access(new URL(`../public/assets/boards/${filename}`, import.meta.url));
  }
});
