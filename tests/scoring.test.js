import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGE_POSITIONS, scoreBridge } from '../dist/scoring.js';

test('weekdays gives strongest alignment to explicit opponents and less to coalition responsibility', () => {
  const results = scoreBridge('weekdays');
  const points = Object.fromEntries(results.map(party => [party.id, party.points]));
  assert.equal(points.shas, 2);
  assert.equal(points.utj, 2);
  assert.equal(points.likud, 1);
  assert.equal(points.kulanu, 1);
  assert.equal(points['jewish-home'], 1);
  assert.equal(points.meretz, -2);
  assert.equal(points['yesh-atid'], -2);
  assert.equal(points['yisrael-beitenu'], -2);
  assert.ok(results.every((party, index) => !index || results[index - 1].points >= party.points));
});

test('Saturday reverses every score without treating missing parties as neutral', () => {
  const weekdays = new Map(scoreBridge('weekdays').map(party => [party.id, party.points]));
  const saturday = scoreBridge('shabbat');
  assert.ok(saturday.every(party => party.points === -weekdays.get(party.id)));
  assert.equal(saturday.find(party => party.id === 'meretz').points, 2);
  assert.equal(saturday.find(party => party.id === 'shas').points, -2);
  assert.equal(saturday.some(party => party.id === 'blank'), false);
  assert.equal(saturday.some(party => party.id === 'unresearched-party'), false);
});

test('no answer yields no ranking, and computing does not mutate source positions', () => {
  const before = structuredClone(BRIDGE_POSITIONS);
  assert.deepEqual(scoreBridge(null), []);
  assert.deepEqual(scoreBridge('unknown'), []);
  scoreBridge('shabbat');
  scoreBridge('weekdays');
  assert.deepEqual(BRIDGE_POSITIONS, before);
});
