import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRepresentation, scoreAcademia } from '../dist/partnership.js';
import { scoreCurrentReligion } from '../dist/current-lists.js';
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

test('academia scores only the researched legislative actions and preserve limited coverage', () => {
  const scores = scoreAcademia('expand');
  assert.deepEqual(scores.map(item => item.id).sort(), ['democrats', 'otzma-yehudit']);
  assert.equal(scores.find(item => item.id === 'otzma-yehudit').points, 1);
  const democrats = scores.find(item => item.id === 'democrats');
  assert.equal(democrats.points, -1);
  assert.equal(democrats.basis, 'partial-action');
  assert.match(democrats.reason, /פרסום המפלגה/);
  const representation = scoreRepresentation('inclusive');
  assert.equal(representation.find(item => item.id === 'beyachad').basis, 'partial-action');
  assert.equal(representation.find(item => item.id === 'democrats').basis, 'partial-action');
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
});
