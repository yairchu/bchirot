import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreVision } from '../dist/visions.js';
import { scoreCurrentReligion, unscoredCurrentLists } from '../dist/current-lists.js';
import { PARTIES, PARTY_NOTICES } from '../dist/parties.js';

test('the two dreams give one positive affinity point only to the researched matching visions', () => {
  assert.deepEqual(scoreVision('whole-land').map(item => item.id).sort(), ['otzma-yehudit', 'religious-zionism']);
  assert.deepEqual(scoreVision('peace').map(item => item.id).sort(), ['democrats', 'raam']);
  for (const choice of ['whole-land', 'peace']) {
    for (const item of scoreVision(choice)) {
      assert.equal(item.points, 1);
      assert.equal(item.basis, 'vision');
      assert.ok(item.source.startsWith('https://'));
      assert.ok(PARTIES.some(([letters, name]) => letters === item.letters && name === item.name));
    }
  }
});

test('a skipped or retired dream choice adds no score or evidence', () => {
  for (const answer of [null, undefined, 'both', 'other', 'unknown']) {
    assert.deepEqual(scoreVision(answer), []);
    assert.deepEqual(scoreCurrentReligion(null, null, null, answer), []);
  }
});

test('vision evidence joins the current Democrats row once without duplicating predecessor scores', () => {
  const before = scoreCurrentReligion('shabbat', 'expand', 'immediate');
  const after = scoreCurrentReligion('shabbat', 'expand', 'immediate', 'peace');
  const democrats = after.filter(item => item.id === 'democrats');
  assert.equal(democrats.length, 1);
  assert.equal(democrats[0].points, 5);
  assert.equal(democrats[0].contributions.length, 3);
  assert.equal(democrats[0].contributions.find(item => item.question === 'החלום שבחרת').evidence.length, 1);
  assert.equal(after.find(item => item.id === 'raam').points, 1);
  assert.equal(unscoredCurrentLists(after).some(([letters]) => letters === 'עם'), false);
  for (const item of before.filter(item => item.id !== 'democrats')) {
    assert.deepEqual(after.find(current => current.id === item.id), item);
  }
});

test('announced withdrawals are excluded from vision affinity as well', t => {
  const previous = PARTY_NOTICES['עם'];
  t.after(() => {
    if (previous) PARTY_NOTICES['עם'] = previous;
    else delete PARTY_NOTICES['עם'];
  });
  PARTY_NOTICES['עם'] = { kind: 'withdrawn' };
  assert.equal(scoreVision('peace').some(item => item.id === 'raam'), false);
  assert.equal(scoreCurrentReligion(null, null, null, 'peace').some(item => item.id === 'raam'), false);
});
