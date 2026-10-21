import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBurdenAnswer, scoreBurden, scoreThreat, burdenLevel } from '../dist/policy-questions.js';
import { scoreCurrentReligion } from '../dist/current-lists.js';
import { PARTIES, PARTY_NOTICES } from '../dist/parties.js';

const currentScores = options => scoreCurrentReligion(null, null, null, null, options);

test('burden answers reject contradictory dimensions and filter hidden advanced choices', () => {
  for (const invalid of [null, undefined, 'draft', [], ['unknown']]) assert.deepEqual(normalizeBurdenAnswer(invalid), []);
  assert.deepEqual(normalizeBurdenAnswer(['draft', 'draft', 'limit-outposts', 'unknown']), ['draft', 'limit-outposts']);
  assert.deepEqual(normalizeBurdenAnswer(['draft', 'exempt', 'limit-outposts']), ['limit-outposts']);
  assert.deepEqual(normalizeBurdenAnswer(['draft', 'protect-outposts'], false), ['draft']);
  assert.deepEqual(normalizeBurdenAnswer(['protect-outposts'], false), []);
});

test('conscription scores documented positions only and reverses with the explicit opposite answer', () => {
  const draft = scoreBurden(['draft']);
  assert.equal(draft.length, 6);
  assert.deepEqual(draft.filter(item => item.points > 0).map(item => item.id).sort(), ['beyachad', 'democrats', 'yashar', 'yisrael-beitenu']);
  assert.deepEqual(draft.filter(item => item.points < 0).map(item => item.id).sort(), ['shas', 'utj']);
  for (const item of draft) {
    assert.equal(item.component, 'גיוס חרדים');
    assert.equal(scoreBurden(['exempt']).find(other => other.id === item.id).points, -item.points);
    assert.ok(PARTIES.some(([letters, name]) => letters === item.letters && name === item.name));
  }
  assert.deepEqual(scoreBurden(null), []);
  assert.deepEqual(scoreBurden(['draft', 'exempt']), []);
});

test('an unanswered component adds no evidence or invented neutral parties', () => {
  const outposts = scoreBurden(['limit-outposts']);
  assert.equal(outposts.length, 2);
  assert.equal(outposts.find(item => item.id === 'democrats').points, 1);
  assert.equal(outposts.find(item => item.id === 'religious-zionism').points, -1);
  for (const item of outposts) {
    assert.equal(item.component, 'משימות הגנה');
    assert.equal(scoreBurden(['protect-outposts']).find(other => other.id === item.id).points, -item.points);
  }
  assert.equal(currentScores({ burdenAnswer: ['limit-outposts'] }).some(item => item.id === 'shas'), false);
});

test('two burden dimensions sum into one covered question, including offsetting preferences', () => {
  const find = answer => currentScores({ burdenAnswer: answer }).find(item => item.id === 'democrats');
  const matched = find(['draft', 'limit-outposts']);
  assert.equal(matched.points, 2);
  assert.equal(matched.contributions.length, 1);
  assert.equal(matched.contributions[0].evidence.length, 2);
  assert.equal(find(['draft', 'protect-outposts']).points, 0);
  assert.equal(find(['exempt', 'protect-outposts']).points, -2);
});

test('threat scores use executed decisions and resignation, with no platform-based Democrats points', () => {
  assert.deepEqual(scoreThreat(null), []);
  assert.deepEqual(scoreThreat('unknown'), []);
  const hamas = scoreThreat('hamas');
  assert.equal(hamas.length, 3);
  assert.equal(hamas.find(item => item.id === 'likud').points, -2);
  assert.equal(hamas.some(item => item.id === 'democrats'), false);
  assert.equal(hamas.find(item => item.id === 'yisrael-beitenu').points, 1);
  assert.equal(hamas.find(item => item.id === 'religious-zionism').points, -1);
  for (const item of hamas) {
    assert.equal(item.basis, item.id === 'likud' ? 'action' : 'partial-action');
    assert.match(item.reason, /2018|2023/);
    assert.ok(item.source.startsWith('https://'));
    assert.equal(scoreThreat('pa').find(other => other.id === item.id).points, -item.points);
  }
});

test('new policy evidence merges into existing ballots without duplicating historic or vision contributions', () => {
  const scores = scoreCurrentReligion('shabbat', 'expand', null, 'peace', { burdenAnswer: ['draft', 'limit-outposts'], threatAnswer: 'hamas' });
  assert.equal(new Set(scores.map(item => item.letters)).size, scores.length);
  const democrats = scores.find(item => item.id === 'democrats');
  assert.equal(democrats.points, 7); // bridge 2 + weekend 2 + vision 1 + burden 2; no threat point
  assert.equal(democrats.contributions.length, 4);
  assert.equal(new Set(democrats.contributions.map(item => item.question)).size, 4);
});

test('withdrawn lists are excluded from all new policy scoring', t => {
  const previous = PARTY_NOTICES['אמת'];
  t.after(() => { if (previous) PARTY_NOTICES['אמת'] = previous; else delete PARTY_NOTICES['אמת']; });
  PARTY_NOTICES['אמת'] = { kind: 'withdrawn' };
  assert.equal(scoreBurden(['draft', 'limit-outposts']).some(item => item.id === 'democrats'), false);
  assert.equal(scoreThreat('hamas').some(item => item.id === 'democrats'), false);
  assert.equal(currentScores({ burdenAnswer: ['draft'], threatAnswer: 'hamas' }).some(item => item.id === 'democrats'), false);
});


test('burden meter shows relative direction, excludes unanswered components and filters basic mode', () => {
  assert.deepEqual(burdenLevel(null), { value: 2, answered: 0, total: 2 });
  assert.deepEqual(burdenLevel(['exempt', 'protect-outposts']), { value: 4, answered: 2, total: 2 });
  assert.deepEqual(burdenLevel(['draft', 'limit-outposts']), { value: 0, answered: 2, total: 2 });
  assert.deepEqual(burdenLevel(['draft', 'protect-outposts']), { value: 2, answered: 2, total: 2 });
  assert.deepEqual(burdenLevel(['exempt', 'protect-outposts'], false), { value: 3, answered: 1, total: 1 });
  assert.deepEqual(burdenLevel(['draft', 'exempt', 'protect-outposts']), { value: 3, answered: 1, total: 2 });
});
