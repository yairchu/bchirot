import test from 'node:test';
import assert from 'node:assert/strict';
import { COALITION_PARTIES, COALITION_RELATIONS, coalitionRelation, coalitionHistory } from '../dist/coalitions.js';

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
