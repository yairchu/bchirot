import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGE_POSITIONS, WEEKEND_POSITIONS, scoreBridge, scoreWeekend, scoreReligion } from '../dist/scoring.js';

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

test('weekend policy options use distance between ban, current arrangement, and expansion', () => {
  const points = answer => Object.fromEntries(scoreWeekend(answer).map(party => [party.id, party.points]));
  assert.equal(points('expand').meretz, 2);
  assert.equal(points('expand').shas, -2);
  assert.equal(points('ban').shas, 2);
  assert.equal(points('ban').meretz, -2);
  assert.equal(scoreWeekend('keep').length, WEEKEND_POSITIONS.length);
  assert.ok(scoreWeekend('keep').every(party => party.points === 0));
  assert.deepEqual(scoreWeekend(null), []);
  assert.deepEqual(scoreWeekend('unknown'), []);
});

test('skipped answers add no contributions and do not invent scores for unresearched parties', () => {
  assert.deepEqual(scoreReligion(null, null), []);
  const weekendOnly = scoreReligion(null, 'expand');
  assert.equal(weekendOnly.length, WEEKEND_POSITIONS.length);
  assert.ok(weekendOnly.every(party => party.contributions.length === 1));
  assert.equal(weekendOnly.some(party => party.id === 'likud'), false);
  const bridgeOnly = scoreReligion('shabbat', null);
  assert.equal(bridgeOnly.length, BRIDGE_POSITIONS.length);
  assert.equal(bridgeOnly.find(party => party.id === 'meretz').points, 2);
});

test('results work without Object.hasOwn, including skipped and invalid answers', t => {
  const descriptor = Object.getOwnPropertyDescriptor(Object, 'hasOwn');
  Object.defineProperty(Object, 'hasOwn', { ...descriptor, value: undefined });
  t.after(() => Object.defineProperty(Object, 'hasOwn', descriptor));
  assert.equal(scoreReligion('shabbat', 'expand').find(party => party.id === 'meretz').points, 4);
  assert.equal(scoreReligion('shabbat', null).length, BRIDGE_POSITIONS.length);
  assert.deepEqual(scoreWeekend('toString'), []);
});

test('combined results sum both answers and distinguish full from partial evidence', () => {
  const results = scoreReligion('shabbat', 'expand');
  assert.equal(results.find(party => party.id === 'meretz').points, 4);
  assert.equal(results.find(party => party.id === 'shas').points, -4);
  assert.equal(results.find(party => party.id === 'meretz').contributions.length, 2);
  assert.equal(results.find(party => party.id === 'likud').contributions.length, 1);
  const firstPartial = results.findIndex(party => party.contributions.length === 1);
  assert.ok(results.slice(0, firstPartial).every(party => party.contributions.length === 2));
  assert.equal(scoreReligion('shabbat', 'ban').find(party => party.id === 'meretz').points, 0);
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
