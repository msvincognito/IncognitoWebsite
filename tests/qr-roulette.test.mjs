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
