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
  const skipMinors = () => {
    assert.equal(window.history.state.bchirot.step, 'child-protection');
    click('next');
  };
  const skipSidewalk = () => {
    assert.equal(window.history.state.bchirot.step, 'sidewalk');
    click('next');
  };
  const skipWomenService = () => {
    assert.equal(window.history.state.bchirot.step, 'women-service');
    click('next');
  };
  const skipDraft = () => {
    assert.equal(window.history.state.bchirot.step, 'draft');
    click('next');
  };
  const declineArmy = () => {
    assert.equal(window.history.state.bchirot.step, 'burden');
    click('next');
    assert.equal(window.history.state.bchirot.step, 'no-army');
    click('no-army-unsure');
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
  return { $, click, choose, hover, robotQuestion, traverse, declineArmy, skipDraft, skipWomenService, skipSidewalk, skipMinors };
}

test('welcome starts the questionnaire; modesty and partnership shows five available questions', async t => {
  const { $, click } = await setup(t);
  assert.equal($('h1').textContent, 'תכלס, בחירות.');
  assert.equal($('.description').textContent, 'השאלון שמבוסס על מעשים, לא על הצהרות');
  assert.equal($('[name="authority"]'), null);
  click('start');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  assert.equal(document.querySelectorAll('[name="topic"]').length, 3);
  assert.equal(document.querySelector('.choice input').name, 'authority');
  assert.ok($('[value="religion-transport"]').closest('label').textContent.includes('דת ותחבורה'));
  assert.ok($('[value="modesty-partnership"]').closest('label').textContent.includes('צניעות ושותפות'));
  assert.ok($('[value="modesty-partnership"]').closest('label').textContent.includes('+5'));
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
  choose('[value="modesty-partnership"]');
  assert.equal($('[data-action="next"]').disabled, false);
  choose('[name="authority"]');
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 3);
  click('next');
  assert.ok($('.party-grid'), 'authority takes precedence over stored topic selections');
  click('back');
  t.mock.timers.tick(0);
  choose('[name="authority"]', false);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 0);
  assert.equal(document.querySelectorAll('[name="topic"]:checked').length, 2);
  choose('[value="religion-transport"]', false);
  choose('[value="modesty-partnership"]', false);
  assert.equal($('[data-action="next"]').disabled, false);
});

for (const mouseAvailable of [true, false]) {
  test(`modesty and partnership answers, history and scoring work on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, traverse, skipWomenService, skipSidewalk, skipMinors } = await setup(t, mouseAvailable);
    click('start'); choose('[value="modesty-partnership"]'); click('next');
    assert.equal($('h2').textContent, 'מי יושב סביב שולחן ההחלטות?');
    assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 6');
    assert.equal($('.button-label').textContent, 'דלג');
    assert.equal(document.querySelectorAll('[name="representation-answer"]').length, 3);
    assert.deepEqual([...document.querySelectorAll('[name="representation-answer"]')].map(input => input.value), ['men-only', 'inclusive', 'equal']);
    assert.ok($('.dilemma-background a'));
    choose('[name="representation-answer"][value="inclusive"]'); click('next');
    assert.equal($('h2').textContent, 'תואר שני, כיתה נפרדת?');
    assert.deepEqual([...document.querySelectorAll('[name="academia-answer"]')].map(input => input.value), ['expand', 'limit', 'ban']);
    assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 6');
    choose('[name="academia-answer"][value="limit"]');
    assert.equal($('.button-label').textContent, 'ממשיכים'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
    assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
    assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '−1');
    assert.equal($('[data-party-id="shas"] .score').textContent, '−1');
    assert.match($('.description').textContent, /2 מתוך 5/);
    await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
    assert.equal($('[name="academia-answer"]:checked').value, 'limit');
    choose('[name="academia-answer"][value="expand"]'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
    assert.equal($('[data-party-id="democrats"] .score').textContent, '0');
    assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '+1');
    click('restart');
    assert.equal(window.history.state.bchirot.representationAnswer, null);
    assert.equal(window.history.state.bchirot.academiaAnswer, null);
  });
}

test('opposing all separated academic tracks retains sources and shows only evidenced disagreement', async t => {
  const { $, click, choose, traverse, skipWomenService, skipSidewalk, skipMinors } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]'); click('next'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 6');
  const links = [...document.querySelectorAll('.dilemma-background a')].map(link => link.href);
  assert.ok(links.some(link => link.includes('11_Noya%20Rimlat.pdf#page=44')));
  assert.ok(links.some(link => link === 'https://lawjournal.huji.ac.il/article/12/1667'));
  const ban = $('[name="academia-answer"][value="ban"]');
  assert.match(ban.closest('label').textContent, /חופש הבחירה גם לחרדים/);
  ban.click();
  assert.equal($('.button-label').textContent, 'ממשיכים'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
  assert.equal($('[data-score-group="positive"]'), null);
  assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '−1');
  assert.equal($('[data-party-id="democrats"]'), null);
  await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
  assert.equal($('[name="academia-answer"]:checked').value, 'ban');
  choose('[name="academia-answer"][value="limit"]'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
  await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
  $('[name="academia-answer"]:checked').click();
  assert.equal($('.button-label').textContent, 'דלג'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal($('.score-table'), null);
});

test('equal representation yields distinct positive and neutral results and can be undone or cleared', async t => {
  const { $, click, choose, traverse, skipWomenService, skipSidewalk, skipMinors } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]'); click('next');
  $('[name="representation-answer"][value="equal"]').click();
  assert.equal($('.button-label').textContent, 'ממשיכים'); click('next'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal(document.querySelectorAll('[data-score-group="positive"] tbody tr').length, 3);
  assert.equal($('[data-party-id="likud"] .score').textContent, '0');
  assert.equal($('[data-party-id="likud"]').closest('[data-score-group]').dataset.scoreGroup, 'neutral');
  assert.equal($('[data-party-id="yashar"] .score').textContent, '+1');
  await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
  assert.equal($('[name="representation-answer"]:checked').value, 'equal');
  $('[name="representation-answer"][value="equal"]').click();
  assert.equal($('.button-label').textContent, 'דלג');
  await traverse('back');
  assert.equal($('[name="representation-answer"]:checked').value, 'equal');
  await traverse('forward'); click('next'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal($('.score-table'), null);
});

test('both partnership questions can be cleared and skipped without inventing party scores', async t => {
  const { $, click, choose, skipWomenService, skipSidewalk, skipMinors } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]'); click('next');
  $('[name="representation-answer"][value="men-only"]').click();
  $('[name="representation-answer"][value="men-only"]').click();
  assert.equal($('.button-label').textContent, 'דלג'); click('next');
  $('[name="academia-answer"][value="expand"]').click();
  $('[name="academia-answer"][value="expand"]').click();
  assert.equal($('.button-label').textContent, 'דלג'); click('next'); skipWomenService(); skipSidewalk(); skipMinors();
  assert.equal($('.score-table'), null);
  assert.equal(window.history.state.bchirot.step, 'bridge-result');
});

for (const mouseAvailable of [true, false]) {
  test(`standalone women service restores, reverses and clears its party scores on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, traverse, skipSidewalk, skipMinors } = await setup(t, mouseAvailable);
    click('start'); choose('[value="modesty-partnership"]'); click('next'); click('next'); click('next');
    assert.equal($('h2').textContent, 'האם נשים צריכות לשרת בצה״ל?');
    assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 6');
    assert.equal($('.button-label').textContent, 'דלג');
    assert.equal(document.querySelectorAll('[name="women-service-answer"]').length, 2);
    assert.equal($('.burden-meter'), null);
    assert.ok([...document.querySelectorAll('.dilemma-background a')].some(link => link.hostname === 'www.idf.il'));
    $('[name="women-service-answer"][value="serve"]').click();
    assert.equal($('.button-label').textContent, 'ממשיכים'); click('next'); skipSidewalk(); skipMinors();
    assert.match($('.women-service-summary').textContent, /כן, שירות צבאי לפי התאמה לתפקיד/);
    assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
    assert.equal($('[data-party-id="religious-zionism"] .score').textContent, '−1');
    assert.match($('.description').textContent, /1 מתוך 5/);
    await traverse('back'); await traverse('back'); await traverse('back');
    assert.equal($('[name="women-service-answer"]:checked').value, 'serve');
    choose('[name="women-service-answer"][value="exempt"]'); click('next'); skipSidewalk(); skipMinors();
    assert.match($('.women-service-summary').textContent, /לפטור נשים/);
    assert.equal($('[data-party-id="democrats"] .score').textContent, '−1');
    assert.equal($('[data-party-id="religious-zionism"] .score').textContent, '+1');
    assert.equal(window.history.state.bchirot.noArmy, false);
    await traverse('back'); await traverse('back'); await traverse('back');
    $('[name="women-service-answer"]:checked').click();
    assert.equal($('.button-label').textContent, 'דלג'); click('next'); skipSidewalk(); skipMinors();
    assert.equal($('.women-service-summary'), null);
    assert.equal($('.score-table'), null);
    await traverse('back'); await traverse('back'); await traverse('back');
    choose('[name="women-service-answer"][value="serve"]'); click('next'); skipSidewalk(); skipMinors(); click('restart');
    assert.equal(window.history.state.bchirot.womenServiceAnswer, null);
  });
}

test('selecting security removes the compact women question and updates the topic budget', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]');
  const count = () => $('[data-topic-count="modesty-partnership"]').textContent;
  assert.equal(count(), '(+5 שאלות)');
  assert.match($('#question-budget').textContent, /6 שאלות/);
  choose('[value="war-dream"]');
  assert.match($('#question-budget').textContent, /10 שאלות/);
  assert.equal($('[data-topic-count="war-dream"]').textContent, '(+4 שאלות)');
  choose('[value="war-dream"]', false);
  assert.equal(count(), '(+5 שאלות)');
  await traverse('back');
  assert.match($('#question-budget').textContent, /10 שאלות/);
  click('next');
  assert.equal(window.history.state.bchirot.step, 'dream');
});

test('a restored compact answer cannot add women service points after switching to the full roster', async t => {
  const { $, click, choose } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]'); click('next'); click('next'); click('next');
  choose('[name="women-service-answer"][value="exempt"]'); click('next');
  const restored = { ...window.history.state.bchirot, step: 'topics', topics: ['war-dream', 'modesty-partnership'] };
  window.history.replaceState({ bchirot: restored }, '');
  window.dispatchEvent(new window.PopStateEvent('popstate', { state: { bchirot: restored } }));
  click('next'); click('next');
  choose('[value="serve-women"]'); click('next');
  for (const step of ['burden-tasks', 'threat', 'emergency', 'representation', 'academia', 'sidewalk', 'child-protection']) {
    assert.equal(window.history.state.bchirot.step, step);
    click('next');
  }
  assert.equal(window.history.state.bchirot.womenServiceAnswer, 'exempt');
  assert.equal($('.women-service-summary'), null);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '0');
  assert.equal($('[data-party-id="religious-zionism"] .score').textContent, '−1');
  assert.equal($('[data-party-id="democrats"] details').querySelectorAll('b').length, 1);
  assert.match($('.description').textContent, /1 מתוך 9/);
});

test('all three topics retain existing question order and append the active partnership dilemmas', async t => {
  const { $, click, choose } = await setup(t);
  click('start');
  choose('[value="modesty-partnership"]'); choose('[value="religion-transport"]'); choose('[value="war-dream"]');
  assert.match($('#question-budget').textContent, /12 שאלות/);
  click('next');
  const route = ['dream', 'burden', 'burden-tasks', 'threat', 'bridge', 'weekend', 'emergency', 'representation', 'academia', 'sidewalk', 'child-protection'];
  for (const [index, step] of route.entries()) {
    assert.equal(window.history.state.bchirot.step, step);
    assert.equal($('.step-label').textContent, `שאלה ${index + 2} מתוך 12`);
    if (step === 'burden') choose('[value="serve-haredim"]');
    if (step === 'representation') choose('[name="representation-answer"][value="inclusive"]');
    if (step === 'academia') choose('[name="academia-answer"][value="limit"]');
    click('next');
  }
  assert.match($('.description').textContent, /3 מתוך 11/);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.equal(document.querySelectorAll('[data-party-id="democrats"]').length, 1);
  assert.equal($('[data-party-id="democrats"] details').querySelectorAll('b').length, 3);
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

test('war route opens with the dream and permits undoing and revising the dream affinity', async t => {
  const { $, click, choose, traverse, declineArmy } = await setup(t);
  click('start');
  choose('[value="war-dream"]');
  click('next');
  assert.equal($('h2').textContent, 'איזה חלום מדבר אליך?');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 6');
  assert.equal(document.querySelectorAll('[name="dream-answer"]').length, 2);
  choose('[name="dream-answer"][value="whole-land"]');
  await traverse('back');
  assert.equal($('[name="dream-answer"]:checked'), null);
  await traverse('forward');
  assert.equal($('[name="dream-answer"]:checked').value, 'whole-land');
  click('next');
  declineArmy();
  click('next'); // Threat: skip.
  choose('[name="emergency-answer"][value="immediate"]');
  click('next');
  assert.match($('.description').textContent, /2 מתוך 4/);
  assert.match($('.dream-summary').textContent, /ארץ ישראל השלמה/);
  assert.equal($('[data-score-group="positive"] [data-party-id="likud"]'), null);
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  click('review-questions');
  choose('[name="dream-answer"][value="peace"]');
  click('next');
  declineArmy();
  click('next');
  click('next'); // Saved emergency answer.
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
  assert.equal($('[data-party-id="raam"] .score').textContent, '+1');
  assert.equal($('[data-party-id="otzma-yehudit"]'), null);
  click('restart');
  assert.equal(window.history.state.bchirot.dreamAnswer, null);
});

test('a dream answer alone adds a weak sourced affinity to current ballots', async t => {
  const { $, click, choose, declineArmy } = await setup(t);
  click('start'); choose('[value="war-dream"]'); click('next');
  choose('[name="dream-answer"][value="whole-land"]'); click('next'); declineArmy();
  click('next'); click('next');
  assert.equal(document.querySelectorAll('[data-score-group="positive"] tbody tr').length, 2);
  assert.equal($('[data-party-id="religious-zionism"] .score').textContent, '+1');
  assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '+1');
  assert.equal($('[data-score-group="negative"]'), null);
  assert.match($('.dream-summary').textContent, /משקל נקודה אחת/);
});

test('both topics ask service once, then follow the shared route without double scoring', async t => {
  const { $, click, choose, declineArmy } = await setup(t);
  click('start'); choose('[value="war-dream"]'); choose('[value="religion-transport"]'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 8');
  assert.equal($('h2').textContent, 'איזה חלום מדבר אליך?');
  click('next'); // Dream.
  declineArmy();
  click('next'); // Threat.
  assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 8');
  choose('[name="bridge-answer"][value="shabbat"]'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 7 מתוך 8');
  choose('[name="weekend-answer"][value="expand"]'); click('next');
  choose('[name="emergency-answer"][value="immediate"]'); click('next');
  assert.equal($('[data-party-id="likud"] .score').textContent, '−2');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+4');
  assert.match($('.description').textContent, /3 מתוך 6/);
});

test('continuing without topics plays a short joke and opens transport without inventing selections', async t => {
  const { $, click, traverse } = await setup(t);
  click('start'); click('next');
  assert.equal($('h2').textContent, 'גם לבחור מה חשוב זו החלטה.');
  t.mock.timers.tick(NO_TOPICS_DURATION);
  assert.equal($('h2').textContent, 'מתי בונים את הגשר?');
  assert.deepEqual(window.history.state.bchirot.topics, []);
  assert.equal(document.querySelectorAll('input:checked').length, 0);
  await traverse('back');
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
  click('next'); await traverse('back'); t.mock.timers.tick(NO_TOPICS_DURATION * 2);
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
});

test('weekend transit offers three policies after the bridge and has one active skip button', async t => {
  const { $, click, choose, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  click('next'); // Bridge.
  assert.equal($('h2').textContent, 'איך נוסעים בסופ״ש?');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 5');
  assert.equal(document.querySelectorAll('[name="weekend-answer"]').length, 3);
  assert.equal($('.button-label').textContent, 'דלג');
  assert.equal($('[data-action="skip"]'), null);
  assert.match($('.dilemma-background').textContent, /הנסיעה בו ללא תשלום/);
  choose('[name="weekend-answer"][value="expand"]'); click('next'); click('next'); skipDraft();
  assert.match($('.description').textContent, /1 מתוך 4/);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="likud"]'), null);
});

test('clicking an already selected answer clears it for skip, and browser Back restores the choice', async t => {
  const { $, click, choose, traverse, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  choose('[name="bridge-answer"][value="shabbat"]'); click('next');
  choose('[name="weekend-answer"][value="expand"]');
  $('[name="weekend-answer"][value="expand"]').click();
  assert.equal($('[name="weekend-answer"]:checked'), null);
  assert.equal($('.button-label').textContent, 'דלג');
  click('next'); click('next'); skipDraft();
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
  await traverse('back'); // Draft.
  await traverse('back'); // Emergency.
  await traverse('back'); // Cleared weekend.
  await traverse('back'); // Selected weekend.
  assert.equal($('[name="weekend-answer"]:checked').value, 'expand');
  click('next'); click('next'); skipDraft();
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+4');
  assert.match($('[data-party-id="democrats"] .score-coverage').textContent, /2 מתוך 2/);
  assert.equal($('[data-party-id="meretz"]'), null);
  assert.match($('[data-party-id="beyachad"] details').textContent, /יש עתיד בלבד/);
});

test('skipping all scored dilemmas gives no ranking and status quo remains a real answer', async t => {
  const { $, click, choose, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  click('next'); click('next'); click('next'); skipDraft();
  assert.equal($('.score-table'), null);
  click('review-questions'); click('next');
  choose('[name="weekend-answer"][value="keep"]'); click('next'); click('next'); skipDraft();
  assert.ok([...document.querySelectorAll('.score')].every(score => score.textContent === '0'));
  assert.equal($('[data-score-group="positive"]'), null);
  assert.ok($('[data-score-group="neutral"]'));
  assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
});

test('wartime transit retains the morning background and only negative Likud responsibility points', async t => {
  const { $, click, choose, traverse, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  click('next'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 5');
  assert.match($('.dilemma-background').textContent, /09:00/);
  assert.match($('.dilemma-background').textContent, /15:00/);
  assert.doesNotMatch($('.dilemma-background').textContent, /בנובמבר הפסיק/);
  assert.equal($('.button-label').textContent, 'דלג');
  choose('[name="emergency-answer"][value="immediate"]');
  assert.equal($('.button-label').textContent, 'ממשיכים'); click('next'); skipDraft();
  assert.equal(document.querySelectorAll('.score-table tbody tr').length, 1);
  assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
  assert.equal($('[data-score-group="positive"]'), null);
  assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
  await traverse('back'); await traverse('back');
  choose('[name="emergency-answer"][value="central-request"]'); click('next'); skipDraft();
  assert.equal($('.score-table'), null);
  assert.equal($('h2').textContent, 'לתשובה הזו אין ניקוד מפלגתי.');
  await traverse('back'); await traverse('back');
  $('[name="emergency-answer"]:checked').click();
  click('next'); skipDraft();
  assert.equal(window.history.state.bchirot.emergencyAnswer, null);
  assert.equal($('.score-table'), null);
});

test('bridge keeps optional source details as the first religion/transport question', async t => {
  const { $, click, choose } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  assert.equal($('h2').textContent, 'מתי בונים את הגשר?');
  assert.equal($('.step-label').textContent, 'שאלה 2 מתוך 5');
  assert.equal($('.dilemma-details').open, false);
  $('.dilemma-details summary').click();
  assert.equal($('.dilemma-details').open, true);
  assert.equal(document.querySelectorAll('.dilemma-background a').length, 4);
});

test('bridge answers remain exclusive and individually undoable across results', async t => {
  const { $, click, choose, traverse, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  choose('[name="bridge-answer"][value="shabbat"]');
  choose('[name="bridge-answer"][value="weekdays"]');
  assert.equal(document.querySelectorAll('[name="bridge-answer"]:checked').length, 1);
  click('next'); click('next'); click('next'); skipDraft();
  assert.equal(window.history.state.bchirot.step, 'bridge-result');
  await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked').value, 'weekdays');
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked').value, 'shabbat');
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked'), null);
  assert.equal($('.button-label').textContent, 'דלג');
  await traverse('forward'); click('next'); click('next'); click('next'); skipDraft(); click('restart');
  choose('[value="religion-transport"]'); click('next');
  assert.equal($('[name="bridge-answer"]:checked'), null);
});

test('changing a bridge answer through browser history recalculates the visible ranking', async t => {
  const { $, click, choose, traverse, skipDraft } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  choose('[name="bridge-answer"][value="weekdays"]'); click('next'); click('next'); click('next'); skipDraft();
  assert.equal($('[data-party-id="shas"] .score').textContent, '+2');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '−2');
  await traverse('back'); await traverse('back'); await traverse('back'); await traverse('back');
  choose('[name="bridge-answer"][value="shabbat"]'); click('next'); click('next'); click('next'); skipDraft();
  assert.equal($('[data-party-id="shas"] .score').textContent, '−2');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+2');
});

test('browser Back and Forward undo and redo individual selections and exclusivity', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start');
  choose('[value="religion-transport"]');
  choose('[value="modesty-partnership"]');
  choose('[name="authority"]');

  await traverse('back');
  assert.equal($('[name="authority"]').checked, false);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 0);
  assert.equal(document.querySelectorAll('[name="topic"]:checked').length, 2);
  await traverse('back');
  assert.equal($('[value="religion-transport"]').checked, true);
  assert.equal($('[value="modesty-partnership"]').checked, false);
  await traverse('forward');
  assert.equal($('[value="modesty-partnership"]').checked, true);
  await traverse('forward');
  assert.equal($('[name="authority"]').checked, true);
  assert.equal(document.querySelectorAll('[name="topic"]:disabled').length, 3);
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

test('threat question retains its sourced actions after the service and missions introduction', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start'); choose('[value="war-dream"]'); click('next');
  click('next'); // Dream.
  choose('[value="serve-haredim"]'); click('next');
  choose('[value="limit-outposts"]'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 6');
  assert.match($('.description').textContent, /2018/);
  assert.match($('.description').textContent, /2023/);
  assert.doesNotMatch($('.description').textContent, /הבהיר/);
  choose('[name="threat-answer"][value="pa"]');
  await traverse('back');
  assert.equal($('[name="threat-answer"]:checked'), null);
  await traverse('forward');
  assert.equal($('[name="threat-answer"]:checked').value, 'pa');
  click('next'); click('next');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
  assert.equal($('[data-party-id="likud"] .score').textContent, '+2');
  assert.match($('.description').textContent, /3 מתוך 5/);
});

test('service follows the opening dream with the requested option order, a live meter and a single skip/continue action', async t => {
  const { $, click, choose } = await setup(t, false);
  click('start');
  assert.equal($('.button-label').textContent, 'דלג');
  choose('[value="war-dream"]');
  assert.equal($('.button-label').textContent, 'ממשיכים'); click('next');
  assert.equal($('h2').textContent, 'איזה חלום מדבר אליך?');
  click('next');
  assert.equal($('h2').textContent, 'מי צריך לשרת בצבא?');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 6');
  assert.deepEqual([...document.querySelectorAll('[name="burden-answer"]')].map(input => input.closest('label').textContent), ['גברים לא חרדים', 'נשים', 'חרדים']);
  assert.equal(document.querySelectorAll('input:checked').length, 0);
  assert.equal($('[name="burden-tasks-answer"]'), null);
  assert.equal($('.burden-meter'), null);
  assert.match($('.no-army-warning').textContent, /אף אחד לא בתורנות/);
  assert.equal($('.button-label').textContent, 'דלג');
  assert.equal($('[data-action="skip"]'), null);
  choose('[value="serve-other-men"]');
  assert.equal($('.no-army-warning'), null);
  const narrow = Number($('#burden-gauge').getAttribute('aria-valuenow'));
  assert.equal($('.button-label').textContent, 'ממשיכים');
  choose('[value="serve-women"]');
  assert.ok(Number($('#burden-gauge').getAttribute('aria-valuenow')) < narrow);
  choose('[value="serve-other-men"]', false); choose('[value="serve-women"]', false);
  assert.equal($('.burden-meter'), null);
  assert.match($('.no-army-warning').textContent, /אף אחד לא בתורנות/);
  assert.equal($('.button-label').textContent, 'דלג');
  t.mock.timers.tick(10000);
  assert.equal(window.history.state.bchirot.step, 'burden');
});

test('missions immediately follow service and continue its meter, with separate history and score coverage', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start'); choose('[value="war-dream"]'); choose('[value="religion-transport"]'); click('next');
  assert.equal($('h2').textContent, 'איזה חלום מדבר אליך?');
  click('next');
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 8');
  choose('[value="serve-haredim"]'); choose('[value="serve-women"]');
  const serviceSnapshot = window.history.state.bchirot.burdenAnswer;
  const level = $('#burden-gauge').getAttribute('aria-valuenow');
  click('next');
  assert.equal($('h2').textContent, 'אילו משימות הצבא צריך לשאת?');
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 8');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), level);
  await traverse('back');
  assert.equal($('h2').textContent, 'מי צריך לשרת בצבא?');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), level);
  await traverse('forward');
  assert.equal($('.button-label').textContent, 'דלג');
  choose('[value="limit-outposts"]');
  assert.equal(Number($('#burden-gauge').getAttribute('aria-valuenow')), Number(level) - 1);
  const tasksSnapshot = window.history.state.bchirot.burdenTasksAnswer;
  choose('[value="seek-partners"]');
  assert.deepEqual(serviceSnapshot, ['serve-women', 'serve-haredim']);
  assert.deepEqual(tasksSnapshot, ['limit-outposts']);
  await traverse('back'); assert.equal($('[value="seek-partners"]').checked, false);
  await traverse('forward'); assert.equal($('[value="seek-partners"]').checked, true);
  click('next'); // To threat.
  click('next'); // To bridge.
  click('next'); // To weekend.
  click('next'); // To emergency.
  click('next'); // To results.
  assert.match($('.description').textContent, /2 מתוך 7/);
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+3');
  assert.match($('[data-party-id="democrats"] .score-coverage').textContent, /2 מתוך 2/);
  assert.equal($('[data-party-id="democrats"] details').querySelectorAll('b').length, 2);
  click('restart');
  assert.equal(window.history.state.bchirot.burdenAnswer, null);
  assert.equal(window.history.state.bchirot.burdenTasksAnswer, null);
});

for (const mouseAvailable of [true, false]) {
  for (const answer of ['faith', 'unsure']) {
    test(`empty-service ${answer} branch is unscored and undoable on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
      const { $, click, choose, traverse } = await setup(t, mouseAvailable);
      click('start'); choose('[value="war-dream"]'); click('next');
      click('next'); // Dream.
      assert.equal($('.button-label').textContent, 'דלג'); click('next');
      assert.equal($('h2').textContent, 'בחרת שלא יהיה צבא. איך נישאר מוגנים?');
      assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 6');
      click(`no-army-${answer}`);
      assert.equal(window.history.state.bchirot.step, 'threat');
      assert.equal(window.history.state.bchirot.noArmyAnswer, answer);
      await traverse('back'); assert.equal(window.history.state.bchirot.step, 'no-army');
      await traverse('forward'); assert.equal(window.history.state.bchirot.noArmyAnswer, answer);
      click('next'); click('next');
      assert.equal($('.score-table'), null);
      assert.match(document.querySelector('#app').textContent, /אינו מקבל ניקוד/);
    });
  }
}

for (const mouseAvailable of [true, false]) {
  test(`compact Haredi draft question supports both answers, history and skip on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, traverse } = await setup(t, mouseAvailable);
    click('start'); choose('[value="religion-transport"]'); click('next');
    click('next'); click('next'); click('next');
    assert.equal($('h2').textContent, 'האם גברים חרדים צריכים לשרת בצבא או ללמוד תורה בלבד?');
    assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 5');
    assert.equal(document.querySelectorAll('[name="draft-answer"]').length, 2);
    assert.equal($('[name="burden-answer"]'), null);
    assert.equal($('.burden-meter'), null);
    assert.equal($('.no-army-warning'), null);
    assert.equal($('.button-label').textContent, 'דלג');
    choose('[name="draft-answer"][value="draft"]');
    assert.equal($('.button-label').textContent, 'לתוצאות');
    click('next');
    assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
    assert.equal($('[data-party-id="shas"] .score').textContent, '−1');
    assert.match($('.description').textContent, /1 מתוך 4/);
    await traverse('back');
    assert.equal($('[name="draft-answer"]:checked').value, 'draft');
    choose('[name="draft-answer"][value="exempt"]');
    assert.equal(document.querySelectorAll('[name="draft-answer"]:checked').length, 1);
    click('next');
    assert.equal($('[data-party-id="democrats"] .score').textContent, '−1');
    assert.equal($('[data-party-id="shas"] .score').textContent, '+1');
    await traverse('back');
    $('[name="draft-answer"]:checked').click();
    assert.equal($('.button-label').textContent, 'דלג');
    await traverse('back');
    assert.equal($('[name="draft-answer"]:checked').value, 'exempt');
    await traverse('forward');
    click('next');
    assert.equal(window.history.state.bchirot.step, 'bridge-result');
    assert.equal(window.history.state.bchirot.noArmy, false);
    assert.equal(window.history.state.bchirot.draftAnswer, null);
    assert.equal($('.score-table'), null);
    click('restart');
    assert.equal(window.history.state.bchirot.draftAnswer, null);
  });
}

test('return from no-army permits a new service choice and restores the normal route', async t => {
  const { $, click, choose } = await setup(t);
  click('start'); choose('[value="war-dream"]'); click('next'); click('next'); click('next');
  assert.equal($('.step-label').textContent, 'שאלה 4 מתוך 6');
  click('choose-service');
  assert.equal($('#burden-gauge'), null);
  assert.ok($('.no-army-warning'));
  choose('[value="serve-haredim"]');
  assert.equal(window.history.state.bchirot.noArmy, false);
  assert.equal($('.step-label').textContent, 'שאלה 3 מתוך 6');
  assert.equal($('.button-label').textContent, 'ממשיכים');
  click('next');
  assert.equal(window.history.state.bchirot.step, 'burden-tasks');
});

test('switching to no-army excludes previously saved mission answers from the results', async t => {
  const { $, click, choose } = await setup(t);
  click('start'); choose('[value="war-dream"]'); click('next');
  click('next'); // Dream.
  choose('[value="serve-haredim"]'); click('next');
  choose('[value="limit-outposts"]'); click('next');
  click('next'); click('next');
  assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
  click('review-questions');
  click('next'); // Dream.
  choose('[value="serve-haredim"]', false);
  assert.equal($('#burden-gauge'), null, 'saved task choices must not show a meter without service');
  assert.ok($('.no-army-warning'));
  click('next'); click('no-army-faith');
  assert.deepEqual(window.history.state.bchirot.burdenTasksAnswer, ['limit-outposts']);
  click('next'); click('next');
  assert.equal($('.score-table'), null);
});

test('native radio clicks select and clear an answer while the focused action and history stay correct', async t => {
  const { $, click, choose, traverse } = await setup(t);
  click('start'); choose('[value="religion-transport"]'); click('next');
  const next = $('[data-action="next"]');
  assert.equal($('.button-label').textContent, 'דלג');
  $('[name="bridge-answer"][value="shabbat"]').click();
  assert.equal($('[name="bridge-answer"]:checked').value, 'shabbat');
  assert.equal($('.button-label').textContent, 'ממשיכים');
  next.focus();
  $('[name="bridge-answer"][value="shabbat"]').click();
  assert.equal($('[name="bridge-answer"]:checked'), null);
  assert.equal($('.button-label').textContent, 'דלג');
  assert.equal(document.activeElement, next);
  await traverse('back');
  assert.equal($('[name="bridge-answer"]:checked').value, 'shabbat');
  assert.equal($('.button-label').textContent, 'ממשיכים');
  await traverse('forward');
  assert.equal($('.button-label').textContent, 'דלג');
});

test('browser history restores the warning versus meter without losing service choices', async t => {
  const { $, click, choose, traverse } = await setup(t, false);
  click('start'); choose('[value="war-dream"]'); click('next'); click('next');
  assert.equal($('#burden-gauge'), null);
  assert.ok($('.no-army-warning'));
  const button = $('[data-action="next"]');
  button.focus();
  choose('[value="serve-other-men"]');
  const level = $('#burden-gauge').getAttribute('aria-valuenow');
  assert.equal($('.no-army-warning'), null);
  assert.equal(document.activeElement, button);
  await traverse('back');
  assert.equal($('#burden-gauge'), null);
  assert.ok($('.no-army-warning'));
  await traverse('forward');
  assert.equal($('#burden-gauge').getAttribute('aria-valuenow'), level);
  assert.equal($('[value="serve-other-men"]').checked, true);
});

for (const mouseAvailable of [true, false]) {
  test(`sidewalk question supports sources, reversible scores, history and skip on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, traverse, skipMinors } = await setup(t, mouseAvailable);
    click('start'); choose('[value="modesty-partnership"]');
    click('next'); click('next'); click('next'); click('next');
    assert.equal($('h2').textContent, 'גם למדרכה יש מגדר?');
    assert.equal($('.step-label').textContent, 'שאלה 5 מתוך 6');
    assert.equal($('.button-label').textContent, 'דלג');
    assert.equal(document.querySelectorAll('[name="sidewalk-answer"]').length, 2);
    assert.ok([...document.querySelectorAll('.dilemma-background a')].some(link => link.href === 'https://www.inn.co.il/news/701567'));
    $('[name="sidewalk-answer"][value="free-choice"]').click();
    assert.equal($('.button-label').textContent, 'ממשיכים');
    click('next'); skipMinors();
    assert.equal($('[data-party-id="democrats"] .score').textContent, '+1');
    assert.equal(document.querySelectorAll('[data-party-id]').length, 2);
    assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '−1');
    assert.match($('[data-party-id="otzma-yehudit"] details').textContent, /הערכת אחריות מיניסטריאלית/);
    assert.match($('.description').textContent, /1 מתוך 5/);
    await traverse('back'); await traverse('back');
    assert.equal($('[name="sidewalk-answer"]:checked').value, 'free-choice');
    choose('[name="sidewalk-answer"][value="separate"]'); click('next'); skipMinors();
    assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
    assert.equal($('[data-party-id="democrats"] .score').textContent, '−1');
    assert.equal($('[data-party-id="otzma-yehudit"]'), null);
    await traverse('back'); await traverse('back');
    $('[name="sidewalk-answer"]:checked').click();
    assert.equal($('.button-label').textContent, 'דלג');
    await traverse('back');
    assert.equal($('[name="sidewalk-answer"]:checked').value, 'separate');
    await traverse('forward'); click('next'); skipMinors();
    assert.equal($('.score-table'), null);
    click('restart');
    assert.equal(window.history.state.bchirot.sidewalkAnswer, null);
  });
}

test('quiz analytics observes progress and skips without sending answers or duplicating browser history views', async t => {
  const { $, click, choose, traverse } = await setup(t);
  const events = [];
  window.plausible = (...args) => events.push(args);
  click('start'); choose('[value="modesty-partnership"]'); click('next');
  choose('[name="representation-answer"][value="men-only"]');
  await traverse('back'); await traverse('forward');
  click('next'); click('next'); click('next'); click('next'); click('next');
  assert.equal(window.history.state.bchirot.step, 'bridge-result');
  assert.deepEqual(events, [
    ['Quiz Started'], ['Question Viewed: representation'], ['Question Viewed: academia'],
    ['Question Skipped: academia'], ['Question Viewed: women-service'],
    ['Question Skipped: women-service'], ['Question Viewed: sidewalk'],
    ['Question Skipped: sidewalk'], ['Question Viewed: child-protection'],
    ['Question Skipped: child-protection'], ['Quiz Completed'],
  ]);
  await traverse('back'); await traverse('forward');
  assert.equal(events.filter(([event]) => event === 'Quiz Completed').length, 1);
  click('restart');
  assert.equal(events.filter(([event]) => event === 'Quiz Started').length, 2);
  assert.equal($('h2').textContent, 'מה הכי חשוב לך?');
});

for (const mouseAvailable of [true, false]) {
  test(`minors protection is last, sourced, scored and undoable on ${mouseAvailable ? 'desktop' : 'mobile'}`, async t => {
    const { $, click, choose, traverse } = await setup(t, mouseAvailable);
    click('start'); choose('[value="modesty-partnership"]');
    for (let step = 0; step < 5; step++) click('next');
    assert.equal(window.history.state.bchirot.step, 'child-protection');
    assert.equal($('h2').textContent, 'מי שומר על הילדות?');
    assert.equal($('.step-label').textContent, 'שאלה 6 מתוך 6');
    assert.equal($('.button-label').textContent, 'דלג');
    assert.match($('.description').textContent, /עדות על אונס כבר בגיל הגן/);
    assert.match($('.description').textContent, /אין אכיפה מספקת/);
    const background = $('.dilemma-background');
    assert.match(background.textContent, /תשעה תיקים/);
    assert.match(background.textContent, /דרעי/);
    assert.match(background.textContent, /מירילשוילי/);
    assert.match(background.textContent, /לא הוכח כאן שההתפקדות גרמה/);
    assert.ok([...background.querySelectorAll('a')].some(link => link.href.includes('press01072026v')));
    choose('[name="child-protection-answer"][value="enforce"]');
    assert.equal($('.button-label').textContent, 'לתוצאות'); click('next');
    assert.equal($('[data-party-id="beyachad"] .score').textContent, '+1');
    assert.equal($('[data-party-id="otzma-yehudit"] .score').textContent, '−1');
    assert.equal($('[data-party-id="likud"] .score').textContent, '−1');
    assert.equal($('[data-party-id="shas"]'), null);
    assert.match($('.description').textContent, /1 מתוך 5/);
    await traverse('back');
    assert.equal($('[name="child-protection-answer"]:checked').value, 'enforce');
    choose('[name="child-protection-answer"][value="community-first"]'); click('next');
    assert.equal($('h2').textContent, 'עדיין לא נמצאה התאמה חיובית');
    assert.equal($('[data-party-id="beyachad"] .score').textContent, '−1');
    assert.equal($('[data-party-id="otzma-yehudit"]'), null);
    assert.equal($('[data-party-id="likud"]'), null);
    await traverse('back');
    $('[name="child-protection-answer"]:checked').click();
    assert.equal($('.button-label').textContent, 'דלג'); click('next');
    assert.equal($('.score-table'), null);
    click('restart');
    assert.equal(window.history.state.bchirot.childProtectionAnswer, null);
  });
}

test('a restored minors protection answer is excluded if its category is no longer selected', async t => {
  const { $, click, choose } = await setup(t);
  click('start'); choose('[value="modesty-partnership"]');
  for (let step = 0; step < 5; step++) click('next');
  choose('[name="child-protection-answer"][value="enforce"]'); click('next');
  const restored = { ...window.history.state.bchirot, step: 'topics', topics: ['religion-transport'] };
  window.history.replaceState({ bchirot: restored }, '');
  window.dispatchEvent(new window.PopStateEvent('popstate', { state: { bchirot: restored } }));
  for (let step = 0; step < 5; step++) click('next');
  assert.equal(window.history.state.bchirot.childProtectionAnswer, 'enforce');
  assert.equal(window.history.state.bchirot.step, 'bridge-result');
  assert.equal($('.score-table'), null);
});
