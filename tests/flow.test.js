import test from 'node:test';
import assert from 'node:assert/strict';
import { afterRobot, progress } from '../dist/flow.js';
import { PARTIES, BALLOT_CHOICES, BLANK_BALLOT, FAKE_BALLOT } from '../dist/parties.js';

test('no gets the confirmation scene on all devices; yes gets the acknowledgement', () => {
  assert.equal(afterRobot('no'), 'sure');
  assert.equal(afterRobot('yes'), 'robot-thanks');
});

test('the counter uses four authority questions and two bridge questions', () => {
  assert.deepEqual(progress('topics', true), { current: 1, total: null });
  assert.deepEqual(progress('bridge', true), { current: 2, total: 2 });
  assert.deepEqual(progress('bridge', false), { current: 2, total: 2 });
  assert.deepEqual(progress('party', true), { current: 2, total: 4 });
  assert.deepEqual(progress('robot', false), { current: 3, total: 4 });
  assert.deepEqual(progress('sure', true), { current: 4, total: 4 });
});

test('blank ballot is a separate answer and not one of the official party choices', () => {
  assert.equal(BALLOT_CHOICES.length, PARTIES.length + 2);
  assert.equal(new Set(BALLOT_CHOICES.map(([value]) => value)).size, BALLOT_CHOICES.length);
  assert.ok(BALLOT_CHOICES.includes(BLANK_BALLOT));
  assert.equal(PARTIES.includes(BLANK_BALLOT), false);
});

test('fictional ballot follows קה and stays outside official party data', () => {
  const index = BALLOT_CHOICES.indexOf(FAKE_BALLOT);
  assert.equal(BALLOT_CHOICES[index - 1][0], 'קה');
  assert.equal(PARTIES.includes(FAKE_BALLOT), false);
});

test('all 38 ballot choices have unique letters and usable names', () => {
  assert.equal(PARTIES.length, 38);
  assert.equal(new Set(PARTIES.map(party => party[0])).size, PARTIES.length);
  assert.ok(PARTIES.every(([letters, name]) => letters.length && name.length));
});
