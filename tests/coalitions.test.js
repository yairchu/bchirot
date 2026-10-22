import test from 'node:test';
import assert from 'node:assert/strict';
import { COALITION_PARTIES, COALITION_RELATIONS, COALITION_NEGOTIATIONS, coalitionRelation, coalitionHistory, coalitionWeight, scoreCoalitions } from '../dist/coalitions.js';

test('a leader-specific veto is directional; missing reverse evidence stays unknown', () => {
  assert.equal(coalitionRelation('רק', 'מחל').label, 'לא עם נתניהו');
  assert.equal(coalitionRelation('מחל', 'רק'), null);
  assert.equal(coalitionRelation('עם', 'רק'), null);
  assert.equal(coalitionRelation('fake', 'רק'), null);
});

test('coordination is distinct from willingness and historical membership', () => {
  assert.equal(coalitionRelation('רק', 'אמת').kind, 'coordination');
  assert.equal(coalitionHistory('רק', 'עם')[0].date, '2021-06-13');
  assert.match(coalitionHistory('רק', 'עם')[0].detail, /רכיבים ההיסטוריים/);
  assert.equal(coalitionHistory('מחל', 'שס')[0].date, '2022-12-29');
  assert.deepEqual(coalitionHistory('מחל', 'מחל'), []);
});

test('all mapped relations have sources, dates and live ballot endpoints', () => {
  const parties = new Set(COALITION_PARTIES.map(party => party.letters));
  assert.equal(parties.has('כן'), false);
  const keys = new Set();
  for (const relation of COALITION_RELATIONS) {
    assert.ok(parties.has(relation.from) && parties.has(relation.to));
    const key = `${relation.from}/${relation.to}`;
    assert.equal(keys.has(key), false);
    keys.add(key);
    assert.match(relation.source, /^https:\/\//);
    assert.match(relation.date, /^\d{4}-\d{2}-\d{2}$/);
  }
});


test('matrix transform combines direct scores with weighted partner scores', () => {
  const scores = [{ letters: 'מחל', points: 2 }, { letters: 'שס', points: -2 }];
  const result = scoreCoalitions(scores);
  assert.equal(result.find(party => party.letters === 'מחל').points, 1.2);
  assert.equal(result.find(party => party.letters === 'שס').points, -1.2);
  assert.equal(result.length, 2); // Unscored parties do not acquire invented zero scores.
  assert.equal(scores[0].points, 2);
});

test('one-sided current veto blocks score propagation in both directions', () => {
  assert.equal(coalitionWeight('מחל', 'רק').weight, 0);
  assert.equal(coalitionWeight('רק', 'מחל').weight, 0);
  const result = scoreCoalitions([{ letters: 'מחל', points: 10 }, { letters: 'רק', points: -2 }]);
  assert.equal(result.find(party => party.letters === 'רק').points, -2);
  assert.equal(result.find(party => party.letters === 'מחל').points, 10);
});

test('unknown links do not spread scores and negative-only inputs never become endorsements', () => {
  assert.equal(coalitionWeight('ודם', 'שס').weight, 0);
  assert.deepEqual(scoreCoalitions([]), []);
  assert.deepEqual(scoreCoalitions([{ letters: 'כן', points: 50 }]), []);
  const result = scoreCoalitions([{ letters: 'מחל', points: -1 }, { letters: 'שס', points: -2 }, { letters: 'רק', points: -3 }]);
  assert.ok(result.every(party => party.points < 0));
  assert.equal(scoreCoalitions([{ letters: 'מחל', points: 0 }])[0].points, 0);
});

test('normalization preserves constant scores regardless of number of mapped partners', () => {
  const scores = COALITION_PARTIES.map(party => ({ ...party, points: 3 }));
  assert.ok(scoreCoalitions(scores).every(party => party.points === 3));
  const base = scoreCoalitions(scores.map(party => ({ ...party, points: party.letters === 'מחל' ? -2 : 1 })));
  const doubled = scoreCoalitions(scores.map(party => ({ ...party, points: party.letters === 'מחל' ? -4 : 2 })));
  for (const party of base) assert.equal(doubled.find(other => other.letters === party.letters).points, party.points * 2);
});


test('Liberman veto overrides the actual 2021 coalition with Raam in both directions', () => {
  assert.equal(coalitionHistory('ל', 'עם').length, 1);
  for (const letters of ['עם', 'ודם', 'שס', 'ג']) {
    assert.equal(coalitionRelation('ל', letters).date, '2026-10-15');
    assert.equal(coalitionWeight('ל', letters).weight, 0);
    assert.equal(coalitionWeight(letters, 'ל').weight, 0);
  }
  const scores = scoreCoalitions([{ letters: 'ל', points: 2 }, { letters: 'עם', points: -8 }]);
  assert.equal(scores.find(party => party.letters === 'ל').points, 2);
  assert.equal(scores.find(party => party.letters === 'עם').points, -8);
});

test('Bennett refusal overrides historical component co-membership, without reversing the declaration', () => {
  assert.equal(coalitionWeight('רק', 'עם').weight, 0);
  assert.equal(coalitionWeight('עם', 'רק').weight, 0);
  assert.equal(coalitionRelation('עם', 'רק'), null);
});

test('Likud and Raam negotiations are sourced and weaker than actual coalition membership', () => {
  assert.equal(coalitionHistory('מחל', 'עם').length, 0);
  assert.equal(COALITION_NEGOTIATIONS[0].reportedOn, '2022-09-02');
  assert.match(COALITION_NEGOTIATIONS[0].detail, /הליכוד טען/);
  assert.match(COALITION_NEGOTIATIONS[0].source, /^https:\/\//);
  assert.equal(coalitionWeight('מחל', 'עם').weight, 0.125);
  assert.equal(coalitionWeight('עם', 'מחל').weight, 0.125);
  assert.ok(coalitionWeight('מחל', 'עם').weight < coalitionWeight('מחל', 'שס').weight);
  const scores = scoreCoalitions([{ letters: 'מחל', points: 1 }, { letters: 'עם', points: -8 }]);
  assert.equal(scores.find(party => party.letters === 'מחל').points, 0);
});
