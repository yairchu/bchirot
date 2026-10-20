import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { CUTSCENE_DURATION } from '../dist/flow.js';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
let run = 0;

async function setup(t, mouseAvailable = true) {
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  globalThis.document = dom.window.document;
  globalThis.matchMedia = () => ({ matches: mouseAvailable });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => {
    dom.window.close();
    delete globalThis.document;
    delete globalThis.matchMedia;
  });
  await import(`../dist/app.js?test=${++run}`);
  const $ = selector => document.querySelector(selector);
  const click = action => {
    const button = $(`[data-action="${action}"]`);
    assert.ok(button, `Action ${action} must exist`);
    button.click();
  };
  const choose = (selector, checked = true) => {
    const input = $(selector);
    assert.ok(input, `Input ${selector} must exist`);
    input.checked = checked;
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  };
  const hover = (pointerType = 'mouse') => {
    const event = new dom.window.Event('pointerenter');
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    $('#sure-button').dispatchEvent(event);
  };
  const robotQuestion = () => {
    click('start');
    choose('[name="authority"]');
    click('next');
    choose('[name="party"][value="מחל"]');
    click('next');
  };
  return { $, click, choose, hover, robotQuestion };
}

test('welcome starts the questionnaire; unfinished choices are explicit TODOs', async t => {
  const { $, click } = await setup(t);
  assert.equal($('h1').textContent, 'תכלס, בחירות.');
  assert.equal($('[name="authority"]'), null);
  click('start');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal(document.querySelectorAll('[name="topic"]').length, 2);
  assert.ok($('[name="topic"]').closest('label').textContent.includes('TODO'));
  assert.equal($('[data-action="next"]').disabled, true);
});

test('authority disables both TODO choices and restores their selections when unchecked', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="todo-1"]');
  choose('[value="todo-2"]');
  assert.equal($('[data-action="next"]').disabled, false);
  choose('[name="authority"]');
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 2);
  click('next');
  assert.ok($('.party-grid'), 'authority takes precedence over stored TODO selections');
  click('back');
  choose('[name="authority"]', false);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 0);
  assert.equal(document.querySelectorAll('[name="topic"]:checked').length, 2);
  choose('[value="todo-1"]', false);
  choose('[value="todo-2"]', false);
  assert.equal($('[data-action="next"]').disabled, true);
});

test('a TODO selection leads to the unfinished branch rather than party results', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="todo-2"]');
  click('next');
  assert.ok($('.todo').textContent.includes('TODO'));
  assert.equal($('.party-grid'), null);
  assert.equal($('.result-ballot'), null);
});

test('desktop hover plays one cutscene and automatically computes the selected result', async t => {
  const { $, hover, click, robotQuestion } = await setup(t);
  robotQuestion();
  click('robot-no');
  assert.equal(document.querySelectorAll('.answer').length, 1);
  assert.equal($('#sure-label').textContent, 'אני בטוח');

  // Merely rendering the scene or receiving a touch event must not start it.
  hover('touch');
  t.mock.timers.tick(5000);
  assert.equal($('#sure-label').textContent, 'אני בטוח');

  hover();
  hover();
  assert.equal($('#sure-label').textContent, 'עזוב, לא משנה');
  assert.ok($('#sure-button').classList.contains('is-playing'));
  assert.equal($('#sure-button').disabled, true);
  t.mock.timers.tick(CUTSCENE_DURATION - 1);
  assert.ok($('#sure-button'));
  t.mock.timers.tick(1);
  assert.equal($('#sure-button'), null);
  assert.ok($('.loading-ballot'));
  t.mock.timers.tick(1100);
  assert.equal($('#loading-message').textContent, 'זה לא כזה קשה במקרה הזה…');
  t.mock.timers.tick(1400);
  assert.equal($('.result-ballot strong').textContent, 'מחל');
  assert.equal($('.loading-ballot'), null);
  click('independent');
  assert.ok($('.todo').textContent.includes('TODO'));
  click('topics');
  assert.equal($('[name="authority"]').checked, false);
});

test('keyboard focus triggers the same automatic scene without a click', async t => {
  const { $, click, robotQuestion } = await setup(t);
  robotQuestion();
  click('robot-no');
  $('#sure-button').focus();
  assert.equal($('#sure-label').textContent, 'עזוב, לא משנה');
  t.mock.timers.tick(CUTSCENE_DURATION);
  assert.ok($('.loading-ballot'));
  t.mock.timers.tick(2500);
  assert.ok($('.result-ballot'));
});

test('mobile skips the sure step and full restart returns to welcome', async t => {
  const { $, click, robotQuestion } = await setup(t, false);
  robotQuestion();
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 3');
  click('robot-no');
  assert.equal($('#sure-button'), null);
  assert.ok($('.loading-ballot'));
  t.mock.timers.tick(2500);
  assert.equal($('.result-ballot strong').textContent, 'מחל');
  click('restart');
  assert.ok($('h1'));
  click('start');
  assert.equal($('[name="authority"]').checked, false);
});

for (const mouseAvailable of [true, false]) {
  test(`a robot answer acknowledges self-awareness on ${mouseAvailable ? 'desktop' : 'mobile'} before computing`, async t => {
    const { $, click, robotQuestion } = await setup(t, mouseAvailable);
    robotQuestion();
    click('robot-yes');
    assert.equal($('.robot-thanks h2').textContent, 'מעריך את המודעות העצמית');
    assert.equal($('.loading-ballot'), null);
    assert.equal($('#sure-button'), null);
    t.mock.timers.tick(CUTSCENE_DURATION - 1);
    assert.ok($('.robot-thanks'));
    t.mock.timers.tick(1);
    assert.equal($('.robot-thanks'), null);
    assert.ok($('.loading-ballot'));
    t.mock.timers.tick(2500);
    assert.equal($('.result-ballot strong').textContent, 'מחל');
  });
}
