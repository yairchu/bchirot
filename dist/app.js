import { CUTSCENE_DURATION, afterRobot, progress } from './flow.js';
import { PARTIES } from './parties.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)').matches;
const state = { step: 'welcome', topics: [], authority: false, party: null, robot: null, cutscene: false };
let history = [];
let timers = [];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function go(step) {
  clearTimers();
  history.push(state.step);
  state.step = step;
  render();
  main.focus({ preventScroll: true });
  if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: 'instant', block: 'start' });
}

function back() {
  clearTimers();
  state.step = history.pop() || 'welcome';
  render();
  main.focus({ preventScroll: true });
}

function restart(step = 'welcome') {
  clearTimers();
  Object.assign(state, { step, topics: [], authority: false, party: null, robot: null, cutscene: false });
  history = [];
  render();
  main.focus({ preventScroll: true });
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
  return frame({ title: 'תכלס, בחירות.', body: '<p class="description">בואו נתחיל במה שחשוב לך.</p><button class="primary" data-action="start">מתחילים <span aria-hidden="true">←</span></button>' }, { heading: 'h1' });
}

function topicsView() {
  // TODO: Define the actual topic choices and their follow-up questions in TODO.md.
  return frame({ title: 'מה הכי חשוב לך?', body: `
    <div role="group" aria-label="אפשרויות שעדיין צריך להגדיר">
      ${['todo-1', 'todo-2'].map((id, index) => `<label class="choice"><input type="checkbox" name="topic" value="${id}" ${state.topics.includes(id) ? 'checked' : ''} ${state.authority ? 'disabled' : ''}><span class="choice-copy"><strong><bdi>TODO ${index + 1}</bdi></strong></span></label>`).join('')}
    </div>
    <label class="choice authority"><input type="checkbox" name="authority" ${state.authority ? 'checked' : ''}><span class="choice-copy"><strong>אני מצביע לפי מישהו שאני סומך עליו</strong><small>רב, משפחה, ראש קהילה, עיתונאי או אדם אחר</small></span></label>
    ${actions('ממשיכים', !state.authority && !state.topics.length)}` });
}

function partyView() {
  return frame({ title: 'ומה ההמלצה שקיבלת?', body: `
    <label class="sr-only" for="party-search">חיפוש לפי שם הרשימה או אותיות הפתק</label><input class="search" id="party-search" type="search" placeholder="חיפוש לפי שם או אותיות הפתק…" autocomplete="off">
    <div class="party-grid" role="radiogroup" aria-label="פתקי ההצבעה">${partyOptions('')}</div>
    <p class="selection-note" id="party-selection" role="status">${state.party ? `הפתק שבחרת: ${escape(state.party[1])} (${escape(state.party[0])})` : ''}</p>
    ${actions('ממשיכים', !state.party)}
    <details class="source-note"><summary>מקור נתוני הפתקים</summary><p><a href="https://bechirot.fyi/lists/26" target="_blank" rel="noopener noreferrer">bechirot.fyi</a>. השמות קוצרו לתצוגה; הרשימה דורשת אימות מול <a href="https://www.gov.il/he/pages/candidates-lists-26" target="_blank" rel="noopener noreferrer">ועדת הבחירות</a>.</p></details>` });
}

function partyOptions(query) {
  const filtered = PARTIES.filter(party => party.join(' ').normalize('NFKC').toLocaleLowerCase('he').includes(query.trim().normalize('NFKC').toLocaleLowerCase('he')));
  return filtered.length ? filtered.map(party => `<label class="ballot"><input type="radio" name="party" value="${escape(party[0])}" ${state.party?.[0] === party[0] ? 'checked' : ''}><span class="ballot-letter">${escape(party[0])}</span><span class="ballot-name">${escape(party[1])}</span></label>`).join('') : '<p class="empty" role="status">לא נמצא פתק כזה.</p>';
}

function robotView() {
  return frame({ title: 'האם אתה רובוט?', body: `
    <div class="answer-options"><button class="answer" data-action="robot-no">לא</button><button class="answer" data-action="robot-yes">כן</button></div>
    <div class="actions"><button class="back" data-action="back">חזרה</button></div>` });
}

function robotThanksView() {
  return frame({ title: 'מעריך את המודעות העצמית', body: '' }, { className: 'robot-thanks' });
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
  timers.push(setTimeout(() => go('loading'), CUTSCENE_DURATION));
}

function loadingView() {
  return `<section class="screen" aria-labelledby="question-title" aria-busy="true"><div class="loading-ballot" aria-hidden="true">✓</div><h2 id="question-title">מחשב את התוצאות שלך…</h2><p class="description" id="loading-message" role="status"></p></section>`;
}

function resultView() {
  // This result repeats the user's input; it does not score or endorse a party.
  const [letters, name] = state.party;
  return frame({ title: `הפתק שלך: ${escape(name)}`, body: `
    <div class="result-ballot"><strong>${escape(letters)}</strong><span>${escape(name)}</span></div>
    <p class="reason"><strong>השיקול שהוביל לתוצאה</strong>זו ההמלצה של האדם שבחרת לסמוך עליו.</p>
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button><button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'התוצאה שלך' });
}

function independentView() {
  // TODO: Replace this explicit stop with the independently chosen positions flow.
  return frame({ title: 'השאלות לפי העמדות שלך', body: '<p class="todo"><span class="todo-label">TODO</span> · לכתוב את השאלות ולבנות את המסלול.</p><button class="primary" data-action="topics">חזרה להתחלה <span aria-hidden="true">↻</span></button>' });
}

function render() {
  const views = { welcome: welcomeView, topics: topicsView, party: partyView, robot: robotView, 'robot-thanks': robotThanksView, sure: sureView, loading: loadingView, result: resultView, independent: independentView };
  app.innerHTML = views[state.step]();
  if (state.step === 'robot-thanks') {
    timers.push(setTimeout(() => go('loading'), CUTSCENE_DURATION));
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
    timers.push(setTimeout(() => go('result'), 2500));
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
    state.party = PARTIES.find(party => party[0] === input.value);
    document.querySelector('[data-action="next"]').disabled = false;
    document.querySelector('#party-selection').textContent = `הפתק שבחרת: ${state.party[1]} (${state.party[0]})`;
  }
});

app.addEventListener('input', event => {
  if (event.target.id === 'party-search') document.querySelector('.party-grid').innerHTML = partyOptions(event.target.value);
});

app.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') back();
  else if (action === 'start') go('topics');
  else if (action === 'restart') restart();
  else if (action === 'independent') restart('independent');
  else if (action === 'topics') restart('topics');
  else if (action === 'next') {
    if (state.step === 'topics' && (state.authority || state.topics.length)) go(state.authority ? 'party' : 'independent');
    else if (state.step === 'party' && state.party) go('robot');
  } else if (action === 'robot-no' || action === 'robot-yes') {
    state.robot = action === 'robot-no' ? 'no' : 'yes';
    go(afterRobot(state.robot, mouseAvailable));
  }
});

render();
