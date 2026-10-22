import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBurdenAnswer, scoreBurden, scoreThreat, burdenLevel } from '../dist/policy-questions.js';
import { scoreCurrentReligion } from '../dist/current-lists.js';
import { PARTIES, PARTY_NOTICES } from '../dist/parties.js';

const currentScores = options => scoreCurrentReligion(null, null, null, null, options);

test('service roster allows multiple independent groups and rejects conflicting task answers', () => {
  for (const invalid of [null, undefined, 'serve-haredim', [], ['unknown'], ['draft', 'exempt']]) assert.deepEqual(normalizeBurdenAnswer(invalid), []);
  assert.deepEqual(normalizeBurdenAnswer(['serve-women', 'serve-haredim', 'serve-haredim', 'limit-outposts']), ['serve-women', 'serve-haredim', 'limit-outposts']);
  assert.deepEqual(normalizeBurdenAnswer(['serve-other-men', 'limit-outposts', 'protect-outposts', 'seek-partners']), ['serve-other-men', 'seek-partners']);
  assert.deepEqual(normalizeBurdenAnswer(['seek-partners', 'self-reliance']), []);
  assert.deepEqual(normalizeBurdenAnswer(['serve-women', 'protect-outposts', 'seek-partners'], false), ['serve-women']);
});

test('service scoring evaluates the explicitly chosen roster; an unanswered roster has no inferred position', () => {
  const draft = scoreBurden(['serve-haredim']);
  assert.equal(draft.length, 6);
  assert.deepEqual(draft.filter(item => item.points > 0).map(item => item.id).sort(), ['beyachad', 'democrats', 'yashar', 'yisrael-beitenu']);
  assert.deepEqual(draft.filter(item => item.points < 0).map(item => item.id).sort(), ['shas', 'utj']);
  for (const item of draft) {
    assert.equal(scoreBurden(['serve-other-men']).find(other => other.id === item.id).points, -item.points);
    assert.ok(PARTIES.some(([letters, name]) => letters === item.letters && name === item.name));
  }
  assert.deepEqual(scoreBurden(['serve-haredim', 'serve-women', 'serve-other-men']), draft);
  assert.deepEqual(scoreBurden(['seek-partners']), []);
  assert.deepEqual(scoreBurden(null), []);
  assert.equal(scoreBurden(['limit-outposts']).some(item => item.id === 'shas'), false);
});

test('outpost direction still scores one component, while partners add no invented party evidence', () => {
  const limit = scoreBurden(['limit-outposts']);
  assert.equal(limit.length, 2);
  assert.equal(limit.find(item => item.id === 'democrats').points, 1);
  assert.equal(limit.find(item => item.id === 'religious-zionism').points, -1);
  for (const item of limit) assert.equal(scoreBurden(['protect-outposts']).find(other => other.id === item.id).points, -item.points);
  assert.deepEqual(scoreBurden(['limit-outposts', 'seek-partners']), limit);
  assert.deepEqual(scoreBurden(['self-reliance']), []);
});

test('service and tasks have separate contributions and coverage after the page split', () => {
  const scores = currentScores({ burdenAnswer: ['serve-haredim', 'serve-women', 'serve-other-men'], burdenTasksAnswer: ['limit-outposts', 'seek-partners'] });
  const democrats = scores.find(item => item.id === 'democrats');
  assert.equal(democrats.points, 2);
  assert.equal(democrats.contributions.length, 2);
  assert.ok(democrats.contributions.every(item => item.evidence.length === 1));
  assert.equal(new Set(democrats.contributions.map(item => item.question)).size, 2);
  assert.equal(currentScores({ burdenAnswer: ['limit-outposts'] }).length, 0);
  assert.equal(currentScores({ burdenTasksAnswer: ['serve-haredim'] }).length, 0);
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
  const scores = scoreCurrentReligion('shabbat', 'expand', null, 'peace', { burdenAnswer: ['serve-haredim'], burdenTasksAnswer: ['limit-outposts'], threatAnswer: 'hamas' });
  assert.equal(new Set(scores.map(item => item.letters)).size, scores.length);
  const democrats = scores.find(item => item.id === 'democrats');
  assert.equal(democrats.points, 7); // bridge 2 + weekend 2 + vision 1 + burden 2; no threat point
  assert.equal(democrats.contributions.length, 5);
  assert.equal(new Set(democrats.contributions.map(item => item.question)).size, 5);
});

test('withdrawn lists are excluded from all new policy scoring', t => {
  const previous = PARTY_NOTICES['אמת'];
  t.after(() => { if (previous) PARTY_NOTICES['אמת'] = previous; else delete PARTY_NOTICES['אמת']; });
  PARTY_NOTICES['אמת'] = { kind: 'withdrawn' };
  assert.equal(scoreBurden(['serve-haredim', 'limit-outposts']).some(item => item.id === 'democrats'), false);
  assert.equal(scoreThreat('hamas').some(item => item.id === 'democrats'), false);
  assert.equal(currentScores({ burdenAnswer: ['serve-haredim'], threatAnswer: 'hamas' }).some(item => item.id === 'democrats'), false);
});


test('meter reflects the breadth of the roster and conditional partnership, without demographic estimates', () => {
  const level = (value, answered, total = 3) => ({ value, baseline: 5, max: 10, answered, total });
  assert.deepEqual(burdenLevel(null), level(5, 0));
  assert.deepEqual(burdenLevel(['serve-other-men']), level(6, 1));
  assert.deepEqual(burdenLevel(['serve-other-men', 'serve-women']), level(4, 1));
  assert.deepEqual(burdenLevel(['serve-other-men', 'serve-women', 'serve-haredim']), level(2, 1));
  assert.deepEqual(burdenLevel(['serve-other-men', 'protect-outposts', 'self-reliance']), level(8, 3));
  assert.deepEqual(burdenLevel(['serve-other-men', 'serve-women', 'serve-haredim', 'limit-outposts', 'seek-partners']), level(0, 3));
  assert.deepEqual(burdenLevel(['seek-partners']), level(4, 1));
  assert.deepEqual(burdenLevel(['self-reliance']), level(6, 1));
  assert.deepEqual(burdenLevel(['seek-partners'], false), level(5, 0, 1));
  assert.deepEqual(burdenLevel(['serve-haredim', 'self-reliance'], false), level(6, 1, 1));
});
