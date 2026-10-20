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
  globalThis.window = dom.window;
  globalThis.matchMedia = () => ({ matches: mouseAvailable });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.after(() => {
    dom.window.close();
    delete globalThis.document;
    delete globalThis.window;
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
  const traverse = direction => {
    const completed = new Promise(resolve => dom.window.addEventListener('popstate', resolve, { once: true }));
    dom.window.history[direction]();
    t.mock.timers.tick(0);
    return completed;
  };
  return { $, click, choose, hover, robotQuestion, traverse };
}

test('welcome starts the questionnaire; unfinished choices are explicit TODOs', async t => {
  const { $, click } = await setup(t);
  assert.equal($('h1').textContent, 'תכלס, בחירות.');
  assert.equal($('[name="authority"]'), null);
  click('start');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal(document.querySelectorAll('[name="topic"]').length, 2);
  assert.equal(document.querySelector('.choice input').name, 'authority');
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
  t.mock.timers.tick(0);
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

test('browser Back and Forward undo and redo individual selections and exclusivity', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="todo-1"]');
  choose('[value="todo-2"]');
  choose('[name="authority"]');

  await traverse('back');
  assert.equal($('[name="authority"]').checked, false);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 0);
  assert.equal(document.querySelectorAll('[name="topic"]:checked').length, 2);
  await traverse('back');
  assert.equal($('[value="todo-1"]').checked, true);
  assert.equal($('[value="todo-2"]').checked, false);
  await traverse('forward');
  assert.equal($('[value="todo-2"]').checked, true);
  await traverse('forward');
  assert.equal($('[name="authority"]').checked, true);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 2);
});

test('browser history restores party choices and crosses question boundaries', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[name="authority"]');
  click('next');
  choose('[name="party"][value="מחל"]');
  choose('[name="party"][value="אמת"]');
  click('next');
  await traverse('back');
  assert.equal($('[name="party"]:checked').value, 'אמת');
  await traverse('back');
  assert.equal($('[name="party"]:checked').value, 'מחל');
  await traverse('back');
  assert.equal($('[name="party"]:checked'), null);
  assert.equal($('[data-action="next"]').disabled, true);
  await traverse('back');
  assert.equal($('[name="authority"]').checked, true);
  await traverse('back');
  assert.equal($('[name="authority"]').checked, false);
  await traverse('back');
  assert.ok($('h1'));
});

test('browser Back cancels pending animations; automatic steps do not trap navigation', async t => {
  const { $, click, robotQuestion, traverse } = await setup(t);
  robotQuestion();
  click('robot-yes');
  await traverse('back');
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
  t.mock.timers.tick(10000);
  assert.equal($('h2').textContent, 'האם אתה רובוט?');

  await traverse('forward');
  assert.ok($('.robot-thanks'));
  t.mock.timers.tick(CUTSCENE_DURATION);
  assert.ok($('.loading-ballot'));
  await traverse('back');
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
  t.mock.timers.tick(10000);
  assert.equal($('.result-ballot'), null);

  await traverse('forward');
  t.mock.timers.tick(2500);
  assert.ok($('.result-ballot'));
  await traverse('back');
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
  await traverse('forward');
  assert.ok($('.result-ballot'));
  click('restart');
  await traverse('back');
  assert.ok($('.result-ballot'));
  await traverse('forward');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal($('[name="authority"]').checked, false);
});

test('returning to the hover question restores an unplayed scene', async t => {
  const { $, click, hover, robotQuestion, traverse } = await setup(t);
  robotQuestion();
  click('robot-no');
  hover();
  await traverse('back');
  t.mock.timers.tick(CUTSCENE_DURATION);
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
  await traverse('forward');
  assert.equal($('#sure-label').textContent, 'אני בטוח');
  hover();
  t.mock.timers.tick(CUTSCENE_DURATION);
  assert.ok($('.loading-ballot'));
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
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
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

test('mobile skips the sure step and restart returns to the first question', async t => {
  const { $, click, robotQuestion } = await setup(t, false);
  robotQuestion();
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 3');
  click('robot-no');
  assert.equal($('#sure-button'), null);
  assert.ok($('.loading-ballot'));
  t.mock.timers.tick(2500);
  assert.equal($('.result-ballot strong').textContent, 'מחל');
  click('restart');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
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
