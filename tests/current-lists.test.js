import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTIES, PARTY_NOTICES } from '../dist/parties.js';
import { scoreReligion } from '../dist/scoring.js';
import { CURRENT_LIST_MAPPINGS, mapHistoricalScores, scoreCurrentReligion, unscoredCurrentLists } from '../dist/current-lists.js';

test('ministerial responsibility is preserved once through current-list mapping', () => {
  const [only] = scoreCurrentReligion(null, null, 'immediate');
  assert.equal(only.id, 'likud');
  assert.equal(only.points, -1);
  assert.equal(only.contributions.length, 1);
  assert.equal(only.contributions[0].evidence.length, 1);
  const before = scoreCurrentReligion('shabbat', 'expand');
  assert.deepEqual(scoreCurrentReligion('shabbat', 'expand', 'central-request'), before);
  const after = scoreCurrentReligion('shabbat', 'expand', 'immediate');
  for (const party of after) {
    const previous = before.find(item => item.id === party.id);
    assert.equal(party.points, previous.points - (party.id === 'likud' ? 1 : 0));
  }
  const likud = after.find(party => party.id === 'likud');
  assert.equal(likud.points, -1);
  assert.equal(likud.contributions.length, 3); // Bridge, the status-quo weekend record, and October 7.
});

test('mapped results use unique present ballots and exclude old standalone parties', () => {
  const results = scoreCurrentReligion('shabbat', 'expand');
  assert.equal(results.length, 9);
  assert.equal(new Set(results.map(party => party.letters)).size, results.length);
  for (const party of results) {
    assert.ok(PARTIES.some(([letters, name]) => letters === party.letters && name === party.name));
    assert.notEqual(PARTY_NOTICES[party.letters]?.kind, 'withdrawn');
  }
  for (const id of ['meretz', 'labor', 'kulanu', 'yesh-atid', 'jewish-home']) {
    assert.equal(results.some(party => party.id === id), false);
  }
  const mappedIds = CURRENT_LIST_MAPPINGS.flatMap(mapping => mapping.historical);
  assert.equal(new Set(mappedIds).size, mappedIds.length);
});

test('mergers get one contribution per question without doubling scores or coverage', () => {
  const democrats = scoreCurrentReligion('shabbat', 'expand').find(party => party.id === 'democrats');
  assert.equal(democrats.points, 4);
  assert.equal(democrats.contributions.length, 2);
  assert.ok(democrats.contributions.every(item => item.points === 2 && item.evidence.length === 2));
  assert.deepEqual(democrats.contributions[0].evidence.map(item => item.id).sort(), ['labor', 'meretz']);
  const likud = scoreCurrentReligion('shabbat', null).find(party => party.id === 'likud');
  assert.equal(likud.points, -1);
  assert.equal(likud.contributions[0].evidence.length, 2);
});

test('Religious Zionism carries the Tkuma component of the Jewish Home coalition responsibility', () => {
  const religiousZionism = scoreCurrentReligion('shabbat', null).find(party => party.letters === 'ט');
  assert.equal(religiousZionism.id, 'religious-zionism');
  assert.equal(religiousZionism.points, -1);
  assert.deepEqual(religiousZionism.contributions[0].evidence.map(item => item.id), ['tkuma']);
  const merged = scoreCurrentReligion('shabbat', null, null, null, { burdenTasksAnswer: ['protect-outposts'] }).filter(party => party.letters === 'ט');
  assert.equal(merged.length, 1); // Historical and current evidence share one row.
  assert.equal(merged[0].contributions.length, 2);
  assert.equal(merged[0].points, 0); // Bridge responsibility −1, outposts +1.
});

test('disagreement between predecessors is averaged within a question', () => {
  const historical = ['labor', 'meretz'].map((id, index) => ({
    id, contributions: [{ question: 'test', id, points: index ? -2 : 2 }],
  }));
  const [democrats] = mapHistoricalScores(historical);
  assert.equal(democrats.points, 0);
  assert.equal(democrats.contributions.length, 1);
});

test('Beyachad averages Lapid evidence with Bennett-led Jewish Home coalition responsibility', () => {
  const beyachad = scoreCurrentReligion('shabbat', 'expand').find(party => party.id === 'beyachad');
  assert.equal(beyachad.letters, 'רק');
  assert.equal(beyachad.points, 2.5);
  assert.equal(beyachad.contributions.length, 2);
  assert.deepEqual(beyachad.contributions[0].evidence.map(item => item.id).sort(), ['jewish-home', 'yesh-atid']);
  assert.match(beyachad.note, /הבית היהודי/);
});

test('skips, missing evidence, and withdrawal notices do not become zero-point recommendations', () => {
  assert.deepEqual(scoreCurrentReligion(null, null), []);
  const weekend = scoreCurrentReligion(null, 'keep');
  assert.equal(weekend.length, 8);
  assert.ok(weekend.every(party => party.points === (party.id === 'likud' ? 1 : 0) && party.contributions.length === 1));
  const unscored = unscoredCurrentLists(weekend);
  assert.ok(unscored.some(([letters]) => letters === 'דרך'));
  assert.ok(unscored.some(([letters]) => letters === 'ט'));
  assert.equal(unscored.some(([letters]) => ['כן', 'אמת', 'blank', 'קקה'].includes(letters)), false);
  const notice = PARTY_NOTICES['שס'];
  PARTY_NOTICES['שס'] = { kind: 'withdrawn' };
  try {
    assert.equal(scoreCurrentReligion('shabbat', 'expand').some(party => party.id === 'shas'), false);
  } finally {
    if (notice) PARTY_NOTICES['שס'] = notice;
    else delete PARTY_NOTICES['שס'];
  }
});

test('mapping preserves source data and keeps partial coverage below complete coverage', () => {
  const historical = scoreReligion('shabbat', 'expand');
  const before = structuredClone(historical);
  const results = mapHistoricalScores(historical);
  assert.deepEqual(historical, before);
  const firstPartial = results.findIndex(party => party.contributions.length === 1);
  assert.equal(firstPartial, 6);
  assert.ok(results.slice(0, firstPartial).every(party => party.contributions.length === 2));
  assert.ok(results.slice(firstPartial).every(party => party.contributions.length === 1));
});

test('weekend records use the same predecessor averaging for Likud and the Joint List', () => {
  for (const [answer, expectedLikud, expectedJoint] of [['expand', 1, 2], ['keep', 1, 0], ['ban', -1, -2]]) {
    const scores = scoreCurrentReligion(null, answer);
    for (const [id, points, evidenceIds] of [['likud', expectedLikud, ['kulanu', 'likud']], ['joint-list', expectedJoint, ['balad', 'hadash']]]) {
      const party = scores.find(item => item.id === id);
      assert.equal(party.points, points);
      assert.equal(party.contributions.length, 1);
      assert.deepEqual(party.contributions[0].evidence.map(item => item.id).sort(), evidenceIds);
    }
    assert.equal(scores.find(item => item.id === 'otzma-yehudit').points, expectedJoint ? -expectedJoint : 0);
  }
  const scores = scoreCurrentReligion(null, 'expand', null, null, { childProtectionAnswer: 'enforce', academiaAnswer: 'expand' });
  for (const id of ['joint-list', 'otzma-yehudit']) assert.equal(scores.filter(item => item.id === id).length, 1);
});
