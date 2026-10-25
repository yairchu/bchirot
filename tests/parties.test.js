import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTIES, PARTY_NOTICES, THRESHOLD_OUTLOOK, thresholdStatus, BLANK_BALLOT, FAKE_BALLOT } from '../dist/parties.js';

test('polling lists contain distinct active ballot IDs and dated sources', () => {
  const classified = [...THRESHOLD_OUTLOOK.expected, ...THRESHOLD_OUTLOOK.borderline];
  assert.equal(new Set(classified).size, classified.length);
  for (const letters of classified) {
    assert.ok(PARTIES.some(party => party[0] === letters));
    assert.notEqual(PARTY_NOTICES[letters]?.kind, 'withdrawn');
  }
  assert.match(THRESHOLD_OUTLOOK.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(THRESHOLD_OUTLOOK.sources.length > 0);
  for (const source of THRESHOLD_OUTLOOK.sources) assert.equal(new URL(source.url).protocol, 'https:');
});

test('a newly added ballot gets the default warning without editing the polling lists', t => {
  PARTIES.push(['test-ballot', 'Test ballot']);
  t.after(() => PARTIES.pop());
  assert.equal(thresholdStatus('test-ballot'), 'unlikely');
  for (const letters of [BLANK_BALLOT[0], FAKE_BALLOT[0], 'unknown']) assert.equal(thresholdStatus(letters), null);
});
