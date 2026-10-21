import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

test('an initialization error shows recovery and diagnostic details instead of a blank page', async t => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:5173/' });
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  t.after(() => {
    dom.window.close();
    delete globalThis.document;
    delete globalThis.window;
  });
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  // Missing matchMedia causes a real failure while evaluating the app module.
  await import('../dist/bootstrap.js');
  await assert.rejects(import('../dist/app.js'), /matchMedia/);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.querySelector('h1').textContent, 'השאלון לא הצליח להיטען.');
  assert.match(document.querySelector('details').textContent, /matchMedia/);
  assert.ok(document.querySelector('#retry-loading'));
  assert.equal(errors.length, 1);
});
