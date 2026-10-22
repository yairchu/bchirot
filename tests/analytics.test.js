import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';
import { createQuizAnalytics } from '../dist/analytics.js';

const loader = new Script(readFileSync(new URL('../dist/analytics-init.js', import.meta.url), 'utf8'));

test('Plausible script loads asynchronously with one queued pageview and automatic history tracking disabled', () => {
  const dom = new JSDOM('<head></head>', { url: 'https://quiz.example/', runScripts: 'outside-only' });
  try {
    loader.runInContext(dom.getInternalVMContext());
    const script = dom.window.document.querySelector('script');
    assert.equal(script.src, 'https://plausible.io/js/pa-sQ3MAbMALwg4k9gDtOIWq.js');
    assert.equal(script.async, true);
    assert.equal(dom.window.plausible.o.autoCapturePageviews, false);
    assert.deepEqual(Array.from(dom.window.plausible.q[0]), ['pageview']);
    assert.equal(dom.window.plausible.q.length, 1);
    dom.window.history.pushState({ answer: 'private' }, '');
    assert.equal(dom.window.plausible.q.length, 1);
  } finally { dom.window.close(); }
});

test('local development and LAN testing neither load Plausible nor queue events', () => {
  for (const url of ['http://localhost:5173/', 'http://quiz.localhost/', 'http://127.0.0.1:5173/', 'http://[::1]:5173/', 'http://192.168.1.5:5173/', 'http://10.0.0.3/', 'http://172.16.0.3/', 'file:///quiz/index.html']) {
    const dom = new JSDOM('<head></head>', { url, runScripts: 'outside-only' });
    try {
      loader.runInContext(dom.getInternalVMContext());
      assert.equal(dom.window.document.querySelector('script'), null, url);
      assert.equal(dom.window.plausible, undefined, url);
    } finally { dom.window.close(); }
  }
});

test('quiz events are fixed names, deduplicated across history and reset for a new attempt', () => {
  const calls = [];
  const analytics = createQuizAnalytics({ plausible: (...args) => calls.push(args) });
  for (const step of ['welcome', 'topics', 'topics', 'party', 'robot', 'sure', 'fake-ballot', 'no-army', 'loading', 'bridge', 'bridge']) analytics.view(step);
  analytics.skip('bridge'); analytics.skip('bridge'); analytics.skip('no-army');
  analytics.view('bridge-result'); analytics.view('result');
  // Invalid inputs cannot become arbitrary event names or transmit state.
  analytics.view('private ballot'); analytics.skip({ party: 'private' });
  assert.deepEqual(calls, [['Quiz Started'], ['Question Viewed: bridge'], ['Question Skipped: bridge'], ['Quiz Completed']]);
  analytics.reset(); analytics.view('topics'); analytics.view('result');
  assert.deepEqual(calls.slice(-2), [['Quiz Started'], ['Quiz Completed']]);
});

test('a missing or broken analytics script cannot break quiz navigation', () => {
  for (const browser of [{}, { plausible() { throw new Error('blocked'); } }]) {
    const analytics = createQuizAnalytics(browser);
    assert.doesNotThrow(() => {
      analytics.view('topics'); analytics.view('bridge'); analytics.skip('bridge'); analytics.view('result'); analytics.reset();
    });
  }
});
