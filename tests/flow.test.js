import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleTopic, afterRobot, progress } from '../dist/flow.js';
import { PARTIES } from '../dist/parties.js';

test('several topics can be selected and toggling one keeps the others', () => {
  const original = ['cost'];
  const selected = toggleTopic(original, 'security');
  assert.deepEqual(selected, ['cost', 'security']);
  assert.deepEqual(original, ['cost']);
  assert.deepEqual(toggleTopic(selected, 'cost'), ['security']);
  assert.deepEqual(toggleTopic(selected, 'unknown'), selected);
});

test('only a mouse user answering no gets the extra joke', () => {
  assert.equal(afterRobot('no', true), 'sure');
  assert.equal(afterRobot('no', false), 'loading');
  assert.equal(afterRobot('yes', true), 'loading');
  assert.equal(afterRobot('yes', false), 'loading');
});

test('the counter adapts to the device and starts without an invented total', () => {
  assert.deepEqual(progress('topics', true), { current: 1, total: null });
  assert.deepEqual(progress('party', true), { current: 2, total: 4 });
  assert.deepEqual(progress('robot', false), { current: 3, total: 3 });
  assert.deepEqual(progress('sure', true), { current: 4, total: 4 });
});

test('all 38 ballot choices have unique letters and usable names', () => {
  assert.equal(PARTIES.length, 38);
  assert.equal(new Set(PARTIES.map(party => party[0])).size, PARTIES.length);
  assert.ok(PARTIES.every(([letters, name]) => letters.length && name.length));
});
