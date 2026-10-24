import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGE_POSITIONS, WEEKEND_POSITIONS, basisLabel, scoreBridge, scoreWeekend, scoreEmergency, scoreReligion } from '../dist/scoring.js';

test('October 7 preparedness gives at most one negative Likud point and no positive points', () => {
  const critical = scoreEmergency('immediate');
  const supportive = scoreEmergency('central-request');
  assert.deepEqual(critical.map(party => [party.id, party.points]), [['likud', -1]]);
  assert.deepEqual(supportive, []);
  assert.deepEqual(scoreEmergency('on-demand'), []); // Retired November policy must not reward Likud.
  assert.equal(critical[0].basis, 'responsibility');
  assert.deepEqual(scoreEmergency(null), []);
  assert.deepEqual(scoreEmergency('unknown'), []);
  assert.deepEqual(scoreReligion(null, null, null), []);
});

test('weekdays gives strongest alignment to explicit opponents and less to coalition responsibility', () => {
  const results = scoreBridge('weekdays');
  const points = Object.fromEntries(results.map(party => [party.id, party.points]));
  assert.equal(points.shas, 2);
  assert.equal(points.utj, 2);
  assert.equal(points.likud, 1);
  assert.equal(points.kulanu, 1);
  assert.equal(points['jewish-home'], 1);
  assert.equal(points.tkuma, 1); // The same coalition standard for both Jewish Home components.
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
  // Likud kept the status quo by an executed decision; the other researched parties sit at the extremes.
  assert.ok(scoreWeekend('keep').every(party => party.points === (party.id === 'likud' ? 2 : 0)));
  assert.equal(points('expand').likud, 0);
  assert.equal(points('ban').likud, 0);
  assert.deepEqual(scoreWeekend(null), []);
  assert.deepEqual(scoreWeekend('unknown'), []);
});

test('the same Saturday-transport scale covers every added explicit party response', () => {
  const expected = { kulanu: 2, 'yesh-atid': 2, hadash: 2, balad: 2, 'otzma-yehudit': -2 };
  for (const [id, points] of Object.entries(expected)) {
    assert.equal(scoreWeekend('expand').find(item => item.id === id).points, points);
    assert.equal(scoreWeekend('ban').find(item => item.id === id).points, -points);
    assert.equal(scoreWeekend('keep').find(item => item.id === id).points, 0);
  }
});

test('skipped answers add no contributions and do not invent scores for unresearched parties', () => {
  assert.deepEqual(scoreReligion(null, null), []);
  const weekendOnly = scoreReligion(null, 'expand');
  assert.equal(weekendOnly.length, WEEKEND_POSITIONS.length);
  assert.ok(weekendOnly.every(party => party.contributions.length === 1));
  assert.equal(weekendOnly.find(party => party.id === 'kulanu').points, 2);
  assert.equal(weekendOnly.some(party => party.id === 'unresearched-party'), false);
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

test('combined results sum both answers and rank by score alone', () => {
  const results = scoreReligion('shabbat', 'expand');
  assert.equal(results.find(party => party.id === 'meretz').points, 4);
  assert.equal(results.find(party => party.id === 'shas').points, -4);
  assert.equal(results.find(party => party.id === 'meretz').contributions.length, 2);
  assert.equal(results.find(party => party.id === 'kulanu').contributions.length, 2);
  assert.ok(results.some(party => party.contributions.length === 1));
  assert.ok(results.every((party, index) => !index || results[index - 1].points > party.points || (results[index - 1].points === party.points && results[index - 1].name.localeCompare(party.name, 'he') <= 0)));
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

test('the displayed weight comes from the points given, not from the basis label', () => {
  assert.equal(basisLabel({ basis: 'action', points: 1 }), 'החלטה שבוצעה — משקל 1');
  assert.equal(basisLabel({ basis: 'action', points: -2 }), 'החלטה שבוצעה — משקל 2');
  assert.equal(basisLabel({ basis: 'composition', points: 0 }), 'הרכב הרשימה שהוגשה');
});
