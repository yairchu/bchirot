import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { CUTSCENE_DURATION, MOBILE_CONFIRM_DELAY, EASTER_EGG_DURATION, NO_TOPICS_DURATION } from '../dist/flow.js';

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
  assert.equal($('.description').textContent, 'השאלון שמבוסס על דילמות פוליטיות אמיתיות שקרו');
  assert.equal($('[name="authority"]'), null);
  click('start');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal(document.querySelectorAll('[name="topic"]').length, 2);
  assert.equal(document.querySelector('.choice input').name, 'authority');
  assert.ok($('[value="religion-transport"]').closest('label').textContent.includes('דת ותחבורה'));
  assert.ok($('[value="todo-2"]').closest('label').textContent.includes('TODO'));
  assert.equal($('[data-action="next"]').disabled, false);
});

test('authority disables both topic choices and restores their selections when unchecked', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
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
  choose('[value="religion-transport"]', false);
  choose('[value="todo-2"]', false);
  assert.equal($('[data-action="next"]').disabled, false);
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

test('continuing without topics plays a short joke without silently selecting a topic', async t => {
  const { $, click, traverse } = await setup(t);
  click('start');
  click('next');
  assert.equal($('h2').textContent, 'גם לבחור מה חשוב זו החלטה.');
  t.mock.timers.tick(NO_TOPICS_DURATION);
  assert.equal($('h2').textContent, 'מתי בונים את הגשר?');
  assert.deepEqual(window.history.state.bchirot.topics, []);
  assert.equal(window.history.state.bchirot.authority, false);
  await traverse('back');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal(document.querySelectorAll('input:checked').length, 0);
  click('next');
  await traverse('back');
  t.mock.timers.tick(NO_TOPICS_DURATION * 2);
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
});

test('weekend transit offers all three policies and scores an answer after skipping the bridge', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  click('skip');
  assert.equal($('h2').textContent, 'איך נוסעים בסופ״ש?');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 3');
  assert.equal(document.querySelectorAll('[name="weekend-answer"]').length, 3);
  assert.equal($('[data-action="next"]').disabled, true);
  $('.dilemma-details summary').click();
  assert.ok($('.dilemma-background').textContent.includes('רישיון'));
  choose('[name="weekend-answer"][value="expand"]');
  click('next');
  assert.ok($('.description').textContent.includes('1 מתוך 2'));
  assert.equal($('[data-party-id="meretz"] .score').textContent, '+2');
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="likud"]'), null);
  assert.ok($('[data-party-id="meretz"] details').textContent.includes('נעים בסופ״ש'));
  assert.equal($('[data-party-id="meretz"] details').textContent.includes('גשר יהודית'), false);
});

test('skipping a selected answer clears its points while browser Back restores the earlier selection', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  choose('[name="bridge-answer"][value="shabbat"]');
  click('next');
  choose('[name="weekend-answer"][value="expand"]');
  click('skip');
  assert.equal($('[data-party-id="meretz"] .score').textContent, '+2');
  assert.equal(window.history.state.bchirot.weekendAnswer, null);
  await traverse('back');
  assert.equal($('[name="weekend-answer"]:checked').value, 'expand');
  click('next');
  assert.equal($('[data-party-id="meretz"] .score').textContent, '+4');
  assert.ok($('[data-party-id="meretz"] .score-coverage').textContent.includes('2 מתוך 2'));
  click('restart');
  choose('[value="religion-transport"]');
  click('next');
  assert.equal($('[name="bridge-answer"]:checked'), null);
  click('skip');
  assert.equal($('[name="weekend-answer"]:checked'), null);
});

test('skipping both dilemmas gives no ranking and explicit status quo remains an answer', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  click('skip');
  click('skip');
  assert.equal($('h2').textContent, 'עוד אין לנו מספיק חומר.');
  assert.equal($('.score-table'), null);
  click('review-questions');
  click('skip');
  choose('[name="weekend-answer"][value="keep"]');
  click('next');
  assert.ok($('.description').textContent.includes('1 מתוך 2'));
  assert.ok($('.score-table'));
  assert.ok([...document.querySelectorAll('.score')].every(score => score.textContent === '0'));
});

test('religion and transport opens the bridge dilemma with optional background', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  assert.equal($('h2').textContent, 'מתי בונים את הגשר?');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 3');
  assert.equal(document.querySelectorAll('[name="bridge-answer"]').length, 2);
  assert.equal($('[data-action="next"]').disabled, true);
  assert.equal($('.dilemma-details').open, false);
  $('.dilemma-details summary').click();
  assert.equal($('.dilemma-details').open, true);
  assert.ok($('.dilemma-background h3').textContent.includes('גשר יהודית'));
  assert.equal(document.querySelectorAll('.dilemma-background a').length, 4);
  assert.equal($('.result-ballot'), null);
});

test('bridge answers are mutually exclusive, undoable, and restored when returning from results', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  choose('[value="todo-2"]');
  click('next');
  choose('[name="bridge-answer"][value="shabbat"]');
  assert.equal($('[data-action="next"]').disabled, false);
  choose('[name="bridge-answer"][value="weekdays"]');
  assert.equal(document.querySelectorAll('[name="bridge-answer"]:checked').length, 1);
  click('next');
  click('skip'); // Only the bridge contributes to this result.
  assert.ok($('.score-table'));
  assert.ok($('.todo').textContent.includes('הנושא הנוסף שבחרת עדיין לא נכלל'));
  assert.equal($('.result-ballot'), null);

  await traverse('back');
  assert.equal($('[name="weekend-answer"]:checked'), null);
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked').value, 'weekdays');
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked').value, 'shabbat');
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked'), null);
  assert.equal($('[data-action="next"]').disabled, true);
  await traverse('forward');
  assert.equal($('[name="bridge-answer"]:checked').value, 'shabbat');
  click('next');
  click('skip');
  click('restart');
  choose('[value="religion-transport"]');
  click('next');
  assert.equal($('[name="bridge-answer"]:checked'), null);
});

test('browser Back and Forward undo and redo individual selections and exclusivity', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  choose('[value="todo-2"]');
  choose('[name="authority"]');

  await traverse('back');
  assert.equal($('[name="authority"]').checked, false);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 0);
  assert.equal(document.querySelectorAll('[name="topic"]:checked').length, 2);
  await traverse('back');
  assert.equal($('[value="religion-transport"]').checked, true);
  assert.equal($('[value="todo-2"]').checked, false);
  await traverse('forward');
  assert.equal($('[value="todo-2"]').checked, true);
  await traverse('forward');
  assert.equal($('[name="authority"]').checked, true);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 2);
});

test('changing a bridge answer through browser history recalculates the visible ranking', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  choose('[name="bridge-answer"][value="weekdays"]');
  click('next');
  click('skip');
  assert.equal($('[data-party-id="shas"] .score').textContent, '+2');
  assert.equal($('[data-party-id="likud"] .score').textContent, '+1');
  assert.equal($('[data-party-id="meretz"] .score').textContent, '−2');
  assert.ok($('.score-context').textContent.includes('מקורות מתקופות שונות'));
  await traverse('back');
  await traverse('back');
  choose('[name="bridge-answer"][value="shabbat"]');
  click('next');
  click('skip');
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="meretz"] .score').textContent, '+2');
  assert.equal($('.todo'), null);
});

test('blank ballot can be selected without search, restored with Back, and returned by authority flow', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[name="authority"]');
  click('next');
  assert.equal($('input[type="search"]'), null);
  assert.equal(document.querySelectorAll('[name="party"]').length, 40);
  assert.equal($('#blank-ballot-note').hidden, true);
  choose('[name="party"][value="blank"]');
  assert.equal($('#blank-ballot-note').hidden, false);
  assert.ok($('#blank-ballot-note').textContent.includes('פסול'));
  click('next');
  await traverse('back');
  assert.equal($('[name="party"]:checked').value, 'blank');
  assert.equal($('#blank-ballot-note').hidden, false);
  assert.equal($('#party-selection').textContent.includes('(blank)'), false);
  choose('[name="party"][value="מחל"]');
  assert.equal($('#blank-ballot-note').hidden, true);
  choose('[name="party"][value="blank"]');
  click('next');
  click('robot-yes');
  t.mock.timers.tick(CUTSCENE_DURATION);
  t.mock.timers.tick(2500);
  assert.equal($('h2').textContent, 'הפתק שלך: פתק לבן');
  assert.ok($('.blank-note').textContent.includes('פסול'));
  assert.equal($('.result-ballot strong'), null);
  assert.equal($('.result-ballot').textContent.includes('blank'), false);
});

test('fictional ballot reveals the joke only after continuing, then returns to usable choices', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[name="authority"]');
  click('next');
  const fictional = $('[name="party"][value="קקה"]');
  assert.ok(fictional);
  assert.equal(fictional.closest('label').querySelector('.ballot-name').textContent, 'לשחרר את הצב');
  choose('[name="party"][value="קקה"]');
  assert.ok($('.party-grid'));
  click('next');
  assert.equal($('h2').textContent, 'הלכת על קקה.');
  assert.deepEqual([...document.querySelectorAll('.description')].map(element => element.textContent), [
    'אתה בטוח שאתה יודע מה אתה עושה?',
    'אין באמת מפלגה כזו. אנחנו רק מנסים לוודא שאתה בקיא בחומר.',
  ]);
  assert.equal($('.result-ballot'), null);
  t.mock.timers.tick(EASTER_EGG_DURATION - 1);
  assert.equal($('.party-grid'), null);
  t.mock.timers.tick(1);
  assert.ok($('.party-grid'));
  assert.equal($('[name="party"]:checked'), null);
  assert.equal($('[data-action="next"]').disabled, true);
  choose('[name="party"][value="מחל"]');
  click('next');
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
});

test('browser Back cancels the fictional ballot scene and Forward can replay it', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[name="authority"]');
  click('next');
  choose('[name="party"][value="קקה"]');
  click('next');
  await traverse('back');
  assert.equal($('[name="party"]:checked').value, 'קקה');
  t.mock.timers.tick(EASTER_EGG_DURATION);
  assert.equal($('[name="party"]:checked').value, 'קקה');
  await traverse('forward');
  assert.equal($('h2').textContent, 'הלכת על קקה.');
  t.mock.timers.tick(EASTER_EGG_DURATION);
  assert.ok($('.party-grid'));
  assert.equal($('[name="party"]:checked'), null);
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

test('mobile automatically plays the same confirmation scene after a short delay', async t => {
  const { $, click, robotQuestion } = await setup(t, false);
  robotQuestion();
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 4');
  click('robot-no');
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 4');
  assert.equal($('#sure-label').textContent, 'אני בטוח');
  // A quick tap or touch focus does not skip the timed reveal.
  $('#sure-button').focus();
  $('#sure-button').click();
  t.mock.timers.tick(MOBILE_CONFIRM_DELAY - 1);
  assert.equal($('#sure-label').textContent, 'אני בטוח');
  t.mock.timers.tick(1);
  assert.equal($('#sure-label').textContent, 'עזוב, לא משנה');
  t.mock.timers.tick(CUTSCENE_DURATION);
  assert.ok($('.loading-ballot'));
  t.mock.timers.tick(2500);
  assert.equal($('.result-ballot strong').textContent, 'מחל');
  click('restart');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal($('[name="authority"]').checked, false);
});

test('mobile Back cancels the delayed reveal and Forward starts it afresh', async t => {
  const { $, click, robotQuestion, traverse } = await setup(t, false);
  robotQuestion();
  click('robot-no');
  t.mock.timers.tick(MOBILE_CONFIRM_DELAY - 1);
  await traverse('back');
  t.mock.timers.tick(10000);
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
  await traverse('forward');
  assert.equal($('#sure-label').textContent, 'אני בטוח');
  t.mock.timers.tick(MOBILE_CONFIRM_DELAY);
  assert.equal($('#sure-label').textContent, 'עזוב, לא משנה');
  await traverse('back');
  t.mock.timers.tick(10000);
  assert.equal($('.loading-ballot'), null);
  assert.equal($('h2').textContent, 'האם אתה רובוט?');
});

for (const mouseAvailable of [true, false]) {
  test(`withdrawn list gives a sourced update instead of a recommendation on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, hover } = await setup(t, mouseAvailable);
    click('start');
    choose('[name="authority"]');
    click('next');
    choose('[name="party"][value="כן"]');
    click('next');
    click('robot-no');
    if (mouseAvailable) hover();
    else t.mock.timers.tick(MOBILE_CONFIRM_DELAY);
    t.mock.timers.tick(CUTSCENE_DURATION);
    t.mock.timers.tick(2500);
    assert.equal($('h2').textContent, 'יש לנו משהו לספר לך');
    assert.ok($('.withdrawn-result').textContent.includes('״כחול לבן״ הודיעה על פרישה'));
    assert.ok($('.withdrawn-result').textContent.includes('להמלצה עדכנית'));
    assert.equal($('.source-note a').href, 'https://www.ynet.co.il/news/elections2026/article/hj00o26m2zl');
    assert.equal($('.result-ballot'), null);
    assert.equal($('.score-table'), null);
    click('independent');
    assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
    assert.equal($('[name="authority"]').checked, false);
  });

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

test('an updated recommendation clears the withdrawn choice and normal results still work', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[name="authority"]');
  click('next');
  choose('[name="party"][value="כן"]');
  click('next');
  click('robot-yes');
  t.mock.timers.tick(CUTSCENE_DURATION);
  t.mock.timers.tick(2500);
  assert.ok($('.withdrawn-result'));
  click('update-recommendation');
  assert.equal($('[name="party"]:checked'), null);
  assert.equal($('[data-action="next"]').disabled, true);
  choose('[name="party"][value="מחל"]');
  click('next');
  click('robot-yes');
  t.mock.timers.tick(CUTSCENE_DURATION);
  t.mock.timers.tick(2500);
  assert.equal($('.result-ballot strong').textContent, 'מחל');
  assert.equal($('.withdrawn-result'), null);
  await traverse('back'); // Robot question.
  await traverse('back'); // Updated recommendation.
  await traverse('back'); // Empty ballot selection after requesting an update.
  await traverse('back'); // The original withdrawal result.
  assert.equal($('h2').textContent, 'יש לנו משהו לספר לך');
  assert.equal($('.result-ballot'), null);
});
