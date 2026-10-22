import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRepresentation, scoreAcademia, scoreWomenService, scoreSidewalk } from '../dist/partnership.js';
import { scoreCurrentReligion } from '../dist/current-lists.js';
import { scoreBurden } from '../dist/policy-questions.js';
import { PARTIES, PARTY_NOTICES } from '../dist/parties.js';

test('partnership evidence refers to current ballots and actions, and answers reverse one point', () => {
  for (const [score, first, second] of [[scoreRepresentation, 'inclusive', 'men-only'], [scoreAcademia, 'expand', 'limit']]) {
    const forward = score(first);
    const reverse = score(second);
    assert.ok(forward.length > 0);
    assert.equal(new Set(forward.map(item => item.letters)).size, forward.length);
    for (const item of forward) {
      assert.ok(PARTIES.some(([letters, name]) => letters === item.letters && name === item.name));
      assert.ok(['action', 'partial-action'].includes(item.basis));
      assert.equal(Math.abs(item.points), 1);
      assert.equal(reverse.find(other => other.id === item.id).points, -item.points);
      assert.ok(item.source.startsWith('https://'));
    }
    for (const invalid of [null, undefined, '', 'unknown']) assert.deepEqual(score(invalid), []);
  }
});

test('women service uses weak parliamentary evidence and reverses one point for the opposite answer', () => {
  const serve = scoreWomenService('serve');
  const exempt = scoreWomenService('exempt');
  assert.deepEqual(serve.map(({ id, points }) => ({ id, points })), [{ id: 'democrats', points: 1 }, { id: 'religious-zionism', points: -1 }]);
  for (const item of serve) {
    assert.equal(item.basis, 'partial-action');
    assert.equal(exempt.find(other => other.id === item.id).points, -item.points);
    assert.ok(PARTIES.some(([letters, name]) => letters === item.letters && name === item.name));
  }
  for (const invalid of [null, undefined, '', 'unknown']) assert.deepEqual(scoreWomenService(invalid), []);
});

test('women service has identical evidence in either question and is counted once with a stale compact answer', () => {
  for (const answer of ['serve', 'exempt']) {
    const roster = ['serve-other-men', ...(answer === 'serve' ? ['serve-women'] : [])];
    const component = scoreBurden(roster).filter(item => item.component === 'שירות נשים בצה״ל');
    assert.deepEqual(component, scoreWomenService(answer));
    const full = scoreCurrentReligion(null, null, null, null, { burdenAnswer: roster });
    const stale = scoreCurrentReligion(null, null, null, null, { burdenAnswer: roster, womenServiceAnswer: answer === 'serve' ? 'exempt' : 'serve' });
    assert.deepEqual(stale, full);
    for (const party of full) {
      assert.equal(party.contributions.length, 1);
      assert.ok(party.contributions[0].evidence.filter(item => item.component === 'שירות נשים בצה״ל').length <= 1);
    }
  }
  for (const roster of [null, [], ['limit-outposts'], ['seek-partners']]) {
    assert.equal(scoreBurden(roster).some(item => item.component === 'שירות נשים בצה״ל'), false);
  }
});

test('academia scores only the researched legislative actions and preserve limited coverage', () => {
  const scores = scoreAcademia('expand');
  assert.deepEqual(scores.map(item => item.id).sort(), ['democrats', 'otzma-yehudit']);
  assert.equal(scores.find(item => item.id === 'otzma-yehudit').points, 1);
  const democrats = scores.find(item => item.id === 'democrats');
  assert.equal(democrats.points, -1);
  assert.equal(democrats.basis, 'partial-action');
  assert.match(democrats.reason, /פרסום המפלגה/);
  const representation = scoreRepresentation('inclusive');
  assert.equal(representation.find(item => item.id === 'beyachad').basis, 'action');
  assert.equal(representation.find(item => item.id === 'democrats').basis, 'action');
});

test('opposing all separated tracks does not infer full opposition from a vote against expansion', () => {
  const ban = scoreAcademia('ban');
  assert.deepEqual(ban.map(({ id, points }) => ({ id, points })), [{ id: 'otzma-yehudit', points: -1 }]);
  assert.equal(scoreAcademia('limit').find(item => item.id === 'democrats').points, 1);
  const results = scoreCurrentReligion(null, null, null, null, { academiaAnswer: 'ban' });
  assert.equal(results.length, 1);
  assert.equal(results[0].points, -1);
  assert.equal(results[0].contributions.length, 1);
});

test('equal representation distinguishes near-balanced lists, limited participation and men-only lists', () => {
  const equal = scoreRepresentation('equal');
  assert.deepEqual(equal.filter(item => item.points > 0).map(item => item.id).sort(), ['beyachad', 'democrats', 'yashar']);
  assert.deepEqual(equal.filter(item => item.points < 0).map(item => item.id).sort(), ['shas', 'utj']);
  assert.equal(equal.find(item => item.id === 'likud').points, 0);
  assert.equal(scoreRepresentation('inclusive').find(item => item.id === 'likud').points, 1);
  assert.ok(equal.filter(item => item.points >= 0).every(item => item.source.endsWith('/66220')));
  const results = scoreCurrentReligion(null, null, null, null, { representationAnswer: 'equal' });
  assert.equal(results.find(item => item.id === 'likud').contributions.length, 1);
  assert.equal(results.find(item => item.id === 'likud').points, 0);
  assert.equal(results.some(item => item.id === 'otzma-yehudit'), false);
});

test('new contributions merge with prior topics without duplicate parties or lost scores', () => {
  const prior = scoreCurrentReligion('shabbat', 'expand');
  const combined = scoreCurrentReligion('shabbat', 'expand', null, null, { representationAnswer: 'inclusive', academiaAnswer: 'limit' });
  assert.equal(new Set(combined.map(item => item.letters)).size, combined.length);
  for (const party of prior) {
    const added = [...scoreRepresentation('inclusive'), ...scoreAcademia('limit')].filter(item => item.id === party.id);
    const result = combined.find(item => item.id === party.id);
    assert.equal(result.points, party.points + added.reduce((sum, item) => sum + item.points, 0));
    assert.equal(result.contributions.length, party.contributions.length + added.length);
  }
  assert.deepEqual(scoreCurrentReligion(null, null, null, null, { representationAnswer: null, academiaAnswer: null }), []);
});

test('withdrawn ballots do not receive either partnership contribution', t => {
  const previous = PARTY_NOTICES['אמת'];
  t.after(() => { if (previous) PARTY_NOTICES['אמת'] = previous; else delete PARTY_NOTICES['אמת']; });
  PARTY_NOTICES['אמת'] = { kind: 'withdrawn' };
  assert.equal(scoreRepresentation('inclusive').some(item => item.id === 'democrats'), false);
  assert.equal(scoreAcademia('limit').some(item => item.id === 'democrats'), false);
  assert.equal(scoreWomenService('serve').some(item => item.id === 'democrats'), false);
});

test('sidewalk scoring follows the documented petition without inferring other party positions', () => {
  for (const [answer, points] of [['free-choice', 1], ['separate', -1]]) {
    const evidence = scoreSidewalk(answer);
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0].id, 'democrats');
    assert.equal(evidence[0].points, points);
    assert.equal(evidence[0].basis, 'partial-action');
    const scores = scoreCurrentReligion(null, null, null, null, { sidewalkAnswer: answer });
    assert.equal(scores.length, 1);
    assert.equal(scores[0].points, points);
    assert.equal(scores[0].contributions.length, 1);
    assert.equal(scores[0].contributions[0].evidence[0].source, evidence[0].source);
  }
  for (const answer of [null, undefined, '', 'unknown']) assert.deepEqual(scoreSidewalk(answer), []);
});
