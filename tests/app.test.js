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
  assert.equal(document.querySelectorAll('[name="topic"]').length, 3);
  assert.equal(document.querySelector('.choice input').name, 'authority');
  assert.ok($('[value="religion-transport"]').closest('label').textContent.includes('דת ומדינה'));
  assert.ok($('[value="todo-2"]').closest('label').textContent.includes('TODO'));
  assert.equal($('[data-action="next"]').disabled, false);
});

test('navigating from a scrolled page uses widely supported scroll behavior', async t => {
  const { $, click } = await setup(t);
  const main = $('#main');
  main.getBoundingClientRect = () => ({ top: -100 });
  const calls = [];
  main.scrollIntoView = options => calls.push(options);
  click('start');
  assert.deepEqual(calls, [{ behavior: 'auto', block: 'start' }]);
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
});

test('authority disables all topic choices and restores their selections when unchecked', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  choose('[value="todo-2"]');
  assert.equal($('[data-action="next"]').disabled, false);
  choose('[name="authority"]');
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 3);
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

test('topic costs, total, and overlap update in place and are restored by browser history', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  const cost = id => $(`[data-topic-count="${id}"]`).textContent;
  assert.equal(cost('religion-transport'), '(+4 שאלות)');
  assert.equal(cost('war-dream'), '(+5 שאלות)');
  const transport = $('[value="religion-transport"]');
  transport.focus();
  choose('[value="religion-transport"]');
  assert.equal(document.activeElement, transport);
  assert.equal(cost('war-dream'), '(+3 שאלות)');
  assert.match($('#question-budget').textContent, /5 שאלות/);
  choose('[value="war-dream"]');
  assert.equal(cost('religion-transport'), '(+4 שאלות)');
  assert.equal(cost('war-dream'), '(+3 שאלות)');
  assert.match($('#question-budget').textContent, /8 שאלות/);
  assert.equal($('.step-label').textContent, 'שאלה 1 מתוך 8');
  choose('[value="religion-transport"]', false);
  assert.equal(cost('war-dream'), '(+5 שאלות)');
  assert.equal(cost('religion-transport'), '(+2 שאלות)');
  assert.match($('#question-budget').textContent, /6 שאלות/);
  await traverse('back');
  assert.deepEqual(window.history.state.bchirot.topics, ['religion-transport', 'war-dream']);
  assert.equal(cost('war-dream'), '(+3 שאלות)');
  assert.match($('#question-budget').textContent, /8 שאלות/);
  await traverse('forward');
  assert.equal(cost('war-dream'), '(+5 שאלות)');
  choose('[name="authority"]');
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 3);
  assert.match($('#question-budget').textContent, /4 שאלות/);
  choose('[name="authority"]', false);
  assert.equal($('[value="war-dream"]').checked, true);
  assert.match($('#question-budget').textContent, /6 שאלות/);
});

test('war and dream alone opens the two-choice dream and reaches the shared question without transport', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  assert.equal($('h2').textContent, 'איזה חלום מדבר אליך?');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 6');
  assert.equal(document.querySelectorAll('[name="dream-answer"]').length, 2);
  assert.equal($('.dilemma-details'), null);
  assert.match($('.selection-note').textContent, /נקודת זיקה אחת/);
  choose('[name="dream-answer"][value="whole-land"]');
  await traverse('back');
  assert.equal($('[name="dream-answer"]:checked'), null);
  await traverse('forward');
  assert.equal($('[name="dream-answer"]:checked').value, 'whole-land');
  click('next');
  click('skip'); // Threat
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  assert.equal(window.history.state.bchirot.step, 'emergency');
  assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 6');
  choose('[name="emergency-answer"][value="immediate"]');
  click('next');
  assert.match($('.description').textContent, /2 מתוך 4/);
  assert.match($('.dream-summary').textContent, /ארץ ישראל השלמה/);
  assert.equal(document.querySelectorAll('.score-table tbody tr').length, 3);
  assert.equal($('[data-score-group="positive"] [data-party-id="likud"]'), null);
  assert.ok($('[data-score-group="negative"] [data-party-id="likud"]'));
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  assert.equal($('[data-party-id="likud"] details').textContent.includes('גשר יהודית'), false);
  click('review-questions');
  assert.equal(window.history.state.bchirot.step, 'dream');
  choose('[name="dream-answer"][value="peace"]');
  click('next');
  click('skip'); // Threat
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('next');
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  assert.match($('.dream-summary').textContent, /שלום בר־קיימא/);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
  assert.equal($('[data-party-id="raam"] .score').textContent, '+1');
  assert.equal($('[data-party-id="otzma-yehudit"]'), null);
  assert.ok($('[data-score-group="negative"] [data-party-id="likud"]'));
  assert.equal(document.querySelector('.score-group').dataset.scoreGroup, 'positive');
  click('restart');
  assert.equal(window.history.state.bchirot.dreamAnswer, null);
});

test('a dream answer alone adds a weak sourced affinity to current ballots', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  choose('[name="dream-answer"][value="whole-land"]');
  click('next');
  click('skip'); // Threat
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip'); // Emergency
  assert.equal(document.querySelectorAll('[data-score-group="positive"] tbody tr').length, 2);
  assert.equal($('[data-party-id="religious-zionism"] .score').textContent, '+1');
  assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '+1');
  assert.equal($('[data-score-group="negative"]'), null);
  assert.match($('.dream-summary').textContent, /ארץ ישראל השלמה/);
  assert.match($('.dream-summary').textContent, /משקל נקודה אחת/);
});

test('both topics ask the shared question once and count its score once', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  choose('[value="religion-transport"]');
  assert.equal($('[data-topic-count="war-dream"]').textContent, '(+5 שאלות)');
  assert.equal($('[data-topic-count="religion-transport"]').textContent, '(+2 שאלות)');
  click('next');
  assert.equal(window.history.state.bchirot.step, 'dream');
  click('skip'); // Dream
  click('skip'); // Threat
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 8');
  choose('[name="bridge-answer"][value="shabbat"]');
  click('next');
  assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 8');
  choose('[name="weekend-answer"][value="expand"]');
  click('next');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  assert.equal($('.step-label').textContent, 'שאלה 8 מתוך 8');
  choose('[name="emergency-answer"][value="immediate"]');
  click('next');
  assert.ok($('.score-table'));
  assert.equal($('[data-party-id="likud"] .score').textContent, '−2');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+4');
  assert.equal($('[data-party-id="likud"] details').querySelectorAll('b').length, 2);
  assert.match($('.description').textContent, /3 מתוך 6/);
  assert.equal($('.dream-summary'), null);
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
  click('skip'); // Bridge
  assert.equal($('h2').textContent, 'איך נוסעים בסופ״ש?');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 5');
  assert.equal(document.querySelectorAll('[name="weekend-answer"]').length, 3);
  assert.equal($('[data-action="next"]').disabled, true);
  $('.dilemma-details summary').click();
  assert.ok($('.dilemma-background').textContent.includes('הנסיעה בו ללא תשלום (כי החוק לא מרשה אחרת)'));
  choose('[name="weekend-answer"][value="expand"]');
  click('next');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.ok($('.description').textContent.includes('1 מתוך 4'));
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="likud"]'), null);
  assert.ok($('[data-party-id="democrats"] details').textContent.includes('נעים בסופ״ש'));
  assert.equal($('[data-party-id="democrats"] details').textContent.includes('גשר יהודית'), false);
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
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.equal(window.history.state.bchirot.weekendAnswer, null);
  await traverse('back');
  assert.equal($('h2').textContent, 'שבת בבוקר. איך מגיעים להציל חיים?');
  await traverse('back'); // No-army follow-up
  await traverse('back'); // Service
  await traverse('back');
  assert.equal($('[name="weekend-answer"]:checked').value, 'expand');
  click('next');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+4');
  assert.ok($('[data-party-id="democrats"] .score-coverage').textContent.includes('2 מתוך 2'));
  assert.match($('[data-party-id="democrats"] th > strong').textContent, /הדמוקרטים · אמת/);
  assert.match($('[data-party-id="democrats"] details').textContent, /מרצ במקור ההיסטורי/);
  assert.match($('[data-party-id="democrats"] details').textContent, /העבודה \/ המחנה הציוני במקור ההיסטורי/);
  assert.match($('[data-party-id="beyachad"] details').textContent, /יש עתיד בלבד/);
  assert.equal($('[data-party-id="meretz"]'), null);
  assert.equal($('[data-party-id="kulanu"]'), null);
  assert.ok([...document.querySelectorAll('.score-method')].some(item => item.textContent.includes('ישר! עם איזנקוט')));
  click('restart');
  choose('[value="religion-transport"]');
  click('next');
  assert.equal($('[name="bridge-answer"]:checked'), null);
  click('skip');
  assert.equal($('[name="weekend-answer"]:checked'), null);
});

test('skipping all dilemmas gives no ranking and explicit status quo remains an answer', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  click('skip'); // Bridge
  click('skip'); // Weekend
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip'); // Emergency
  assert.equal($('h2').textContent, 'עוד אין לנו מספיק חומר.');
  assert.equal($('.score-table'), null);
  click('review-questions');
  click('skip');
  choose('[name="weekend-answer"][value="keep"]');
  click('next');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.ok($('.description').textContent.includes('1 מתוך 4'));
  assert.ok($('.score-table'));
  assert.ok([...document.querySelectorAll('.score')].every(score => score.textContent === '0'));
  assert.equal($('[data-score-group="positive"]'), null);
  assert.equal($('[data-score-group="negative"]'), null);
  assert.ok($('[data-score-group="neutral"]'));
  assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
});

test('wartime transit is question six, has balanced background, and scores only Likud', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  click('skip');
  click('skip');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 6');
  assert.equal(document.querySelectorAll('[name="emergency-answer"]').length, 2);
  assert.equal($('[data-action="next"]').disabled, true);
  assert.match($('.dilemma-background').textContent, /הגעת חיילים ב־7 באוקטובר התעכבה/);
  assert.equal($('.dilemma-background').textContent.includes('בנובמבר הפסיק'), false);
  assert.match($('.dilemma-background').textContent, /09:00/);
  assert.match($('.dilemma-background').textContent, /15:00/);
  choose('[name="emergency-answer"][value="immediate"]');
  click('next');
  assert.equal(document.querySelectorAll('.score-table tbody tr').length, 1);
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  assert.match($('[data-party-id="likud"] details').textContent, /אחריות מיניסטריאלית/);
  assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
  assert.equal($('[data-score-group="positive"]'), null);
  assert.match($('[data-score-group="negative"] h3').textContent, /מחלוקת/);
  assert.ok($('[data-score-group="negative"] [data-party-id="likud"]'));
  assert.match($('.result-status').textContent, /אף רשימה שנבדקה לא קיבלה ציון חיובי/);
  assert.match($('.description').textContent, /1 מתוך 4/);
  await traverse('back');
  assert.equal($('[name="emergency-answer"]:checked').value, 'immediate');
  choose('[name="emergency-answer"][value="central-request"]');
  click('next');
  assert.equal($('.score-table'), null);
  assert.equal($('h2').textContent, 'לתשובה הזו אין ניקוד מפלגתי.');
  await traverse('back');
  click('skip');
  assert.equal($('.score-table'), null);
  assert.equal(window.history.state.bchirot.emergencyAnswer, null);
  await traverse('back');
  assert.equal($('[name="emergency-answer"]:checked').value, 'central-request');
  click('next');
  click('restart');
  assert.equal(window.history.state.bchirot.emergencyAnswer, null);
  choose('[value="religion-transport"]');
  click('next');
  choose('[name="bridge-answer"][value="shabbat"]');
  click('next');
  click('skip');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  choose('[name="emergency-answer"][value="central-request"]');
  click('next');
  assert.match($('.description').textContent, /לחלופה שבחרת בשאלת 7 באוקטובר אין ניקוד מפלגתי/);
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  assert.match($('[data-party-id="likud"] .score-coverage').textContent, /1 מתוך 2/);
  assert.equal($('[data-party-id="likud"] details').textContent.includes('תחבורה בבוקר 7 באוקטובר'), false);
});

test('religion and transport opens the bridge dilemma with optional background', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  assert.equal($('h2').textContent, 'מתי בונים את הגשר?');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 5');
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
  click('skip');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip'); // Only the bridge contributes to this result.
  assert.ok($('.score-table'));
  assert.ok($('.todo').textContent.includes('הנושא הנוסף שבחרת עדיין לא נכלל'));
  assert.equal($('.result-ballot'), null);

  await traverse('back');
  assert.equal($('[name="emergency-answer"]:checked'), null);
  await traverse('back'); // No-army follow-up
  await traverse('back'); // Service
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
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
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
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 3);
});

test('changing a bridge answer through browser history recalculates the visible ranking', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  choose('[name="bridge-answer"][value="weekdays"]');
  click('next');
  click('skip');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.equal($('[data-party-id="shas"] .score').textContent, '+2');
  assert.equal($('[data-party-id="likud"] .score').textContent, '+1');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '−2');
  assert.ok($('.score-context').textContent.includes('הניקוד מבוסס על התנהלות בעבר'));
  await traverse('back');
  await traverse('back');
  await traverse('back');
  await traverse('back');
  await traverse('back');
  choose('[name="bridge-answer"][value="shabbat"]');
  click('next');
  click('skip');
  click('next'); // Continue with nobody selected.
  click('no-army-unsure');
  click('skip');
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
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

test('threat question cites actions, restores its answer and allows skipping other dimensions', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  click('skip'); // Dream
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 6');
  assert.equal(document.querySelectorAll('[name="threat-answer"]').length, 2);
  assert.match($('.description').textContent, /2018/);
  assert.doesNotMatch($('.description').textContent, /הבהיר/);
  assert.match($('.description').textContent, /2023/);
  choose('[name="threat-answer"][value="pa"]');
  await traverse('back');
  assert.equal($('[name="threat-answer"]:checked'), null);
  await traverse('forward');
  assert.equal($('[name="threat-answer"]:checked').value, 'pa');
  click('next');
  choose('[value="serve-haredim"]');
  click('next');
  choose('[value="limit-outposts"]');
  click('next');
  click('skip'); // Emergency
  assert.equal($('[data-party-id="shas"] .score').textContent, '−1');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.equal($('[data-party-id="likud"] .score').textContent, '+2');
  assert.match($('[data-party-id="likud"] details').textContent, /החלטה שבוצעה/);
  assert.match($('.description').textContent, /3 מתוך 5/);
});



test('service is a short standalone choice with no burden meter or warning, even after selection', async t => {
  const { $, click, choose } = await setup(t, false);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  click('skip');
  click('skip');
  assert.equal($('h2').textContent, 'מי צריך לשרת בצבא?');
  assert.equal(document.querySelectorAll('[name="burden-answer"]:checked').length, 0);
  assert.equal($('[name="burden-tasks-answer"]'), null);
  assert.equal($('.burden-meter'), null);
  assert.equal($('.no-army-warning'), null);
  assert.equal($('.button-label').textContent, 'ממשיכים');
  choose('[value="serve-other-men"]');
  choose('[value="serve-women"]');
  assert.equal(document.querySelectorAll('[name="burden-answer"]:checked').length, 2);
  assert.equal($('.burden-meter'), null);
  choose('[value="serve-other-men"]', false);
  choose('[value="serve-women"]', false);
  assert.equal($('.burden-meter'), null);
  t.mock.timers.tick(10000);
  assert.equal(window.history.state.bchirot.step, 'burden');
});

test('service and missions have separate pages, answers, histories and score coverage', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  choose('[value="religion-transport"]');
  click('next');
  click('skip');
  click('skip');
  click('skip');
  click('skip');
  assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 8');
  choose('[value="serve-haredim"]');
  choose('[value="serve-women"]');
  const serviceSnapshot = window.history.state.bchirot.burdenAnswer;
  click('next');
  assert.equal($('h2').textContent, 'אילו משימות הצבא צריך לשאת?');
  assert.equal($('.step-label').textContent, 'שאלה 7 מתוך 8');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), '4');
  await traverse('back');
  assert.equal($('h2').textContent, 'מי צריך לשרת בצבא?');
  assert.equal($('[value="serve-women"]').checked, true);
  assert.equal($('.burden-meter'), null);
  await traverse('forward');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), '4');
  assert.equal($('[name="burden-answer"]'), null);
  assert.equal($('.button-label').textContent, 'דלג');
  choose('[value="limit-outposts"]');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), '3');
  const tasksSnapshot = window.history.state.bchirot.burdenTasksAnswer;
  choose('[value="seek-partners"]');
  assert.deepEqual(serviceSnapshot, ['serve-haredim', 'serve-women']);
  assert.deepEqual(tasksSnapshot, ['limit-outposts']);
  await traverse('back');
  assert.equal($('[value="seek-partners"]').checked, false);
  await traverse('forward');
  assert.equal($('[value="seek-partners"]').checked, true);
  click('next');
  click('skip');
  assert.match($('.description').textContent, /2 מתוך 7/);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.match($('[data-party-id="democrats"] .score-coverage').textContent, /2 מתוך 2/);
  assert.equal($('[data-party-id="democrats"] details').querySelectorAll('b').length, 2);
  click('restart');
  assert.equal(window.history.state.bchirot.burdenAnswer, null);
  assert.equal(window.history.state.bchirot.burdenTasksAnswer, null);
  assert.equal(window.history.state.bchirot.noArmy, false);
  assert.equal(window.history.state.bchirot.noArmyAnswer, null);
});

for (const mouseAvailable of [true, false]) {
  for (const answer of ['faith', 'unsure']) {
    test(`empty-service ${answer} branch is unscored and undoable on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
      const { $, click, choose, traverse } = await setup(t, mouseAvailable);
      click('start');
      choose('[value="war-dream"]');
      click('next');
      click('skip');
      click('skip');
      click('next'); // Explicitly continue with no army.
      assert.equal($('h2').textContent, 'בחרת שלא יהיה צבא. איך נישאר מוגנים?');
      assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 6');
      assert.ok($('[data-action="choose-service"]'));
      click(`no-army-${answer}`);
      assert.equal(window.history.state.bchirot.step, 'emergency');
      assert.equal(window.history.state.bchirot.noArmyAnswer, answer);
      assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 6');
      await traverse('back');
      assert.equal(window.history.state.bchirot.step, 'no-army');
      await traverse('forward');
      assert.equal(window.history.state.bchirot.noArmyAnswer, answer);
      click('skip');
      assert.equal($('.score-table'), null);
      assert.match(document.querySelector('#app').textContent, /ללא ניקוד|אינו מקבל ניקוד/);
    });
  }
}

test('return from no-army lets the user change their mind and shrinks the religion route', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  click('next');
  click('skip');
  click('skip');
  click('next');
  assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 6');
  click('choose-service');
  assert.equal($('#burden-gauge'), null);
  choose('[value="serve-haredim"]');
  assert.equal(window.history.state.bchirot.noArmy, false);
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 5');
  click('next');
  assert.equal(window.history.state.bchirot.step, 'emergency');
  assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 5');
});

test('switching to no-army excludes saved mission answers from the new results', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  click('skip');
  click('skip');
  choose('[value="serve-haredim"]');
  click('next');
  choose('[value="limit-outposts"]');
  click('next');
  click('skip');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  click('review-questions');
  click('skip');
  click('skip');
  choose('[value="serve-haredim"]', false);
  click('next');
  click('no-army-faith');
  assert.equal(window.history.state.bchirot.step, 'emergency');
  assert.deepEqual(window.history.state.bchirot.burdenTasksAnswer, ['limit-outposts']);
  click('skip');
  assert.equal($('.score-table'), null);
});
