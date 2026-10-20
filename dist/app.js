import { CUTSCENE_DURATION, EASTER_EGG_DURATION, TOPIC_CHOICES, afterRobot, progress } from './flow.js';
import { BALLOT_CHOICES, BLANK_BALLOT, BLANK_BALLOT_SOURCE, FAKE_BALLOT } from './parties.js';
import { BRIDGE_DILEMMA } from './dilemmas.js';
import { BASIS_LABELS, scoreBridge } from './scoring.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)').matches;
const state = { step: 'welcome', topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null };
let timers = [];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function saveHistory(replace = false) {
  const snapshot = { ...state, topics: [...state.topics], party: state.party ? [...state.party] : null };
  window.history[replace ? 'replaceState' : 'pushState']({ bchirot: snapshot }, '');
}

function focusQuestion() {
  main.focus({ preventScroll: true });
  if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function go(step, replace = false) {
  clearTimers();
  state.step = step;
  saveHistory(replace);
  render();
  focusQuestion();
}

function back() {
  window.history.back();
}

function restart(step = 'topics') {
  clearTimers();
  Object.assign(state, { step, topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null });
  saveHistory();
  render();
  focusQuestion();
}

function frame(content, { stage = '', heading = 'h2', className = '' } = {}) {
  const { current, total } = progress(state.step, mouseAvailable);
  const label = current ? `שאלה ${current} ${total ? `מתוך ${total}` : 'מתוך כמה שצריך'}` : stage;
  return `<section class="screen ${className}" aria-labelledby="question-title">
    ${label ? `<div class="step-label">${label}</div>` : ''}
    <${heading} id="question-title">${content.title}</${heading}>
    ${content.body}</section>`;
}

function actions(nextLabel = 'ממשיכים', disabled = false) {
  return `<div class="actions"><button class="primary" data-action="next" ${disabled ? 'disabled' : ''}>${nextLabel}<span aria-hidden="true">←</span></button><button class="back" data-action="back">חזרה</button></div>`;
}

function welcomeView() {
  return frame({ title: 'תכלס, בחירות.', body: '<p class="description">השאלון שמבוסס על דילמות פוליטיות אמיתיות שקרו</p><button class="primary" data-action="start">מתחילים <span aria-hidden="true">←</span></button>' }, { heading: 'h1' });
}

function topicsView() {
  // TODO: Add more religion/transport dilemmas and define the remaining topics in TODO.md.
  return frame({ title: 'מה הכי חשוב לך?', body: `
    <label class="choice authority"><input type="checkbox" name="authority" ${state.authority ? 'checked' : ''}><span class="choice-copy"><strong>כבר אמרו לי למי להצביע</strong><small>רב, משפחה, ראש קהילה, עיתונאי או אדם אחר</small><small class="authority-joke">יש לנו קיצור דרך בשבילך.</small></span></label>
    <div role="group" aria-label="נושאים לבחירה">
      ${TOPIC_CHOICES.map(({ id, label }) => `<label class="choice"><input type="checkbox" name="topic" value="${id}" ${state.topics.includes(id) ? 'checked' : ''} ${state.authority ? 'disabled' : ''}><span class="choice-copy"><strong><bdi>${escape(label)}</bdi></strong></span></label>`).join('')}
    </div>
    ${actions('ממשיכים', !state.authority && !state.topics.length)}` });
}

function partyView() {
  return frame({ title: 'ומה ההמלצה שקיבלת?', body: `
    <div class="party-grid" role="radiogroup" aria-label="פתקי ההצבעה">${partyOptions()}</div>
    <p class="selection-note" id="party-selection" role="status">${state.party ? `הפתק שבחרת: ${escape(state.party[1])}${state.party[0] === BLANK_BALLOT[0] ? '' : ` (${escape(state.party[0])})`}` : ''}</p>
    <div id="blank-ballot-note" ${state.party?.[0] === BLANK_BALLOT[0] ? '' : 'hidden'}>${blankBallotNote()}</div>
    ${actions('ממשיכים', !state.party)}
    <details class="source-note"><summary>מקור נתוני הפתקים</summary><p><a href="https://bechirot.fyi/lists/26" target="_blank" rel="noopener noreferrer">bechirot.fyi</a>. השמות קוצרו לתצוגה; הרשימה דורשת אימות מול <a href="https://www.gov.il/he/pages/candidates-lists-26" target="_blank" rel="noopener noreferrer">ועדת הבחירות</a>.</p></details>` });
}

function blankBallotNote() {
  return `<p class="blank-note">פתק לבן ריק נחשב לפתק פסול ואינו נכלל במניין הקולות הכשרים. <a href="${BLANK_BALLOT_SOURCE}" target="_blank" rel="noopener noreferrer">הסבר ועדת הבחירות</a>.</p>`;
}

function partyOptions() {
  return BALLOT_CHOICES.map(party => `<label class="ballot"><input type="radio" name="party" value="${escape(party[0])}" ${state.party?.[0] === party[0] ? 'checked' : ''}><span class="ballot-letter" ${party[0] === BLANK_BALLOT[0] ? 'aria-hidden="true"' : ''}>${party[0] === BLANK_BALLOT[0] ? '&nbsp;' : escape(party[0])}</span><span class="ballot-name">${escape(party[1])}</span></label>`).join('');
}

function robotView() {
  return frame({ title: 'האם אתה רובוט?', body: `
    <div class="answer-options"><button class="answer" data-action="robot-no">לא</button><button class="answer" data-action="robot-yes">כן</button></div>
    <div class="actions"><button class="back" data-action="back">חזרה</button></div>` });
}

function robotThanksView() {
  return frame({ title: 'מעריך את המודעות העצמית', body: '' }, { className: 'robot-thanks' });
}

function fakeBallotView() {
  return frame({ title: 'הלכת על קקה.', body: '<p class="description">אין באמת מפלגה כזאת.</p>' });
}

function sureView() {
  return frame({ title: 'האם אתה בטוח?', body: `
    <div class="answer-options"><button type="button" class="answer cutscene-option" id="sure-button" aria-describedby="cutscene-help"><span id="sure-label">אני בטוח</span></button></div>
    <span class="sr-only" id="cutscene-help">מעבר עכבר או מיקוד מקלדת יפעילו קטע קצר שימשיך אוטומטית.</span>
    <span class="sr-only" id="cutscene-status" role="status"></span>` });
}

function startCutscene() {
  if (state.step !== 'sure' || state.cutscene) return;
  state.cutscene = true;
  const option = document.querySelector('#sure-button');
  option.disabled = true;
  option.classList.add('is-playing');
  document.querySelector('#sure-label').textContent = 'עזוב, לא משנה';
  document.querySelector('#cutscene-status').textContent = 'עזוב, לא משנה';
  timers.push(setTimeout(() => go('loading', true), CUTSCENE_DURATION));
}

function loadingView() {
  return `<section class="screen" aria-labelledby="question-title" aria-busy="true"><div class="loading-ballot" aria-hidden="true">✓</div><h2 id="question-title">מחשב את התוצאות שלך…</h2><p class="description" id="loading-message" role="status"></p></section>`;
}

function resultView() {
  // This result repeats the user's input; it does not score or endorse a party.
  const [letters, name] = state.party;
  const blank = letters === BLANK_BALLOT[0];
  return frame({ title: `הפתק שלך: ${escape(name)}`, body: `
    <div class="result-ballot">${blank ? '<span class="sr-only">פתק לבן ריק</span>' : `<strong>${escape(letters)}</strong><span>${escape(name)}</span>`}</div>
    <p class="reason"><strong>השיקול שהוביל לתוצאה</strong>זו ההמלצה של האדם שבחרת לסמוך עליו.</p>
    ${blank ? blankBallotNote() : ''}
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button><button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'התוצאה שלך' });
}

function bridgeView() {
  const dilemma = BRIDGE_DILEMMA;
  return frame({ title: dilemma.title, body: `
    <p class="description">${escape(dilemma.context)}</p>
    <div class="dilemma-options" role="radiogroup" aria-label="מתי עדיף לבצע את עבודות הגשר?">
      ${dilemma.options.map(option => `<label class="choice dilemma-option"><input type="radio" name="bridge-answer" value="${option.id}" ${state.bridgeAnswer === option.id ? 'checked' : ''}><span class="choice-copy"><strong>${escape(option.label)}</strong><small>${escape(option.detail)}</small></span></label>`).join('')}
    </div>
    <details class="dilemma-details"><summary>לפרטים נוספים</summary>
      <div class="dilemma-background"><h3>זה קרה בגשר יהודית</h3>
        ${dilemma.timeline.map(item => `<p>${escape(item.text)} <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escape(item.source)}</a>.</p>`).join('')}
      </div>
    </details>
    ${actions('לתוצאות', !state.bridgeAnswer)}` });
}

function bridgeResultView() {
  const answer = BRIDGE_DILEMMA.options.find(option => option.id === state.bridgeAnswer);
  const scores = scoreBridge(state.bridgeAnswer);
  return frame({ title: 'איפה התשובה שלך פוגשת את המפלגות?', body: `
    <p class="description">בחרת: ${escape(answer.label)}.</p>
    <p class="score-context">ההשוואה מבוססת על פרשת גשר יהודית ב־2018–2019. המפלגות מוצגות בשמותיהן אז, והניקוד מתייחס לדילמה הזו.</p>
    <table class="score-table"><caption class="sr-only">ניקוד המפלגות לפי התשובה לשאלת גשר יהודית</caption>
      <thead><tr><th scope="col">מפלגה</th><th scope="col">נקודות</th></tr></thead>
      <tbody>${scores.map(party => `<tr data-party-id="${party.id}"><th scope="row"><strong>${escape(party.name)}</strong><details><summary>למה?</summary><p>${escape(party.reason)}</p><p>${BASIS_LABELS[party.basis]} · <a href="${party.source}" target="_blank" rel="noopener noreferrer">מקור</a>${party.followupSource ? ` · <a href="${party.followupSource}" target="_blank" rel="noopener noreferrer">חידוש העבודות</a>` : ''}</p></details></th><td><bdi class="score ${party.points > 0 ? 'score-positive' : 'score-negative'}">${party.points > 0 ? '+' : '−'}${Math.abs(party.points)}</bdi></td></tr>`).join('')}</tbody>
    </table>
    <details class="score-method"><summary>איך הניקוד עובד?</summary><p>ציון חיובי הוא באותו כיוון כמו התשובה שלך, וציון שלילי הוא בכיוון ההפוך. משקל של 2 נקודות ניתן לעמדה מתועדת; משקל של נקודה אחת ניתן להתנהלות מעורבת או להערכת אחריות קואליציונית. האחריות הקואליציונית היא פרשנות במודל, ולא עמדה מפורשת של המפלגה.</p><p>רשימות שעדיין לא נבדקו אינן מקבלות ציון. שמות ומיזוגים של מפלגות השתנו מאז; הניקוד כאן אינו מיפוי אוטומטי לרשימות בבחירות הנוכחיות.</p></details>
    ${state.topics.includes('todo-2') ? '<p class="todo"><span class="todo-label">TODO</span> · הנושא הנוסף שבחרת עדיין לא נכלל בחישוב.</p>' : ''}
    <div class="actions"><button class="primary" data-action="restart">להתחיל מחדש <span aria-hidden="true">↻</span></button><button class="back" data-action="back">חזרה</button></div>` }, { stage: 'דת ותחבורה · תוצאות' });
}

function independentView() {
  // TODO: Continue the topic flow with more dilemmas and sourced comparisons.
  const religionTransport = state.topics.includes('religion-transport');
  return frame({ title: religionTransport ? 'דת ותחבורה' : 'השאלות לפי העמדות שלך', body: `<p class="todo"><span class="todo-label">TODO</span> · ${religionTransport ? 'להוסיף את הדילמה הבאה ולבנות את המשך המסלול.' : 'לכתוב את השאלות ולבנות את המסלול.'}</p><button class="primary" data-action="topics">חזרה להתחלה <span aria-hidden="true">↻</span></button>` });
}

function render() {
  const views = { welcome: welcomeView, topics: topicsView, bridge: bridgeView, 'bridge-result': bridgeResultView, party: partyView, 'fake-ballot': fakeBallotView, robot: robotView, 'robot-thanks': robotThanksView, sure: sureView, loading: loadingView, result: resultView, independent: independentView };
  app.innerHTML = views[state.step]();
  if (state.step === 'fake-ballot') {
    timers.push(setTimeout(() => {
      state.party = null;
      go('party', true);
    }, EASTER_EGG_DURATION));
  }
  if (state.step === 'robot-thanks') {
    timers.push(setTimeout(() => go('loading', true), CUTSCENE_DURATION));
  }
  if (state.step === 'sure') {
    const option = document.querySelector('#sure-button');
    option.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') startCutscene();
    });
    option.addEventListener('focus', startCutscene);
  }
  if (state.step === 'loading') {
    timers.push(setTimeout(() => {
      document.querySelector('#loading-message').textContent = 'זה לא כזה קשה במקרה הזה…';
    }, 1100));
    timers.push(setTimeout(() => go('result', true), 2500));
  }
}

app.addEventListener('change', event => {
  const input = event.target;
  if (input.name === 'authority') {
    state.authority = input.checked;
    app.querySelectorAll('[name="topic"]').forEach(topic => { topic.disabled = state.authority; });
    document.querySelector('[data-action="next"]').disabled = !state.authority && !state.topics.length;
  } else if (input.name === 'topic') {
    state.topics = [...app.querySelectorAll('[name="topic"]:checked')].map(topic => topic.value);
    document.querySelector('[data-action="next"]').disabled = !state.authority && !state.topics.length;
  } else if (input.name === 'party') {
    state.party = BALLOT_CHOICES.find(party => party[0] === input.value);
    document.querySelector('[data-action="next"]').disabled = false;
    document.querySelector('#party-selection').textContent = `הפתק שבחרת: ${state.party[1]}${state.party[0] === BLANK_BALLOT[0] ? '' : ` (${state.party[0]})`}`;
    document.querySelector('#blank-ballot-note').hidden = state.party[0] !== BLANK_BALLOT[0];
  } else if (input.name === 'bridge-answer') {
    state.bridgeAnswer = input.value;
    document.querySelector('[data-action="next"]').disabled = false;
  }
  if (['authority', 'topic', 'party', 'bridge-answer'].includes(input.name)) saveHistory();
});

app.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') back();
  else if (action === 'start') go('topics');
  else if (action === 'restart') restart();
  else if (action === 'independent') restart();
  else if (action === 'topics') restart('topics');
  else if (action === 'next') {
    if (state.step === 'topics' && (state.authority || state.topics.length)) go(state.authority ? 'party' : state.topics.includes('religion-transport') ? 'bridge' : 'independent');
    else if (state.step === 'party' && state.party) go(state.party[0] === FAKE_BALLOT[0] ? 'fake-ballot' : 'robot');
    else if (state.step === 'bridge' && state.bridgeAnswer) go('bridge-result');
  } else if (action === 'robot-no' || action === 'robot-yes') {
    state.robot = action === 'robot-no' ? 'no' : 'yes';
    go(afterRobot(state.robot, mouseAvailable));
  }
});

window.addEventListener('popstate', event => {
  if (!event.state?.bchirot) return;
  clearTimers();
  Object.assign(state, event.state.bchirot);
  render();
  focusQuestion();
});

saveHistory(true);
render();
