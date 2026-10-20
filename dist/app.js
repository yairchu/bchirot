import { TOPICS, toggleTopic, afterRobot, progress } from './flow.js';
import { PARTIES } from './parties.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)').matches;
const state = { step: 'topics', topics: [], authority: false, party: null, robot: null, swapped: false, independent: false };
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
  if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function back() {
  clearTimers();
  state.step = history.pop() || 'topics';
  render();
  main.focus({ preventScroll: true });
}

function restart(independent = false) {
  clearTimers();
  Object.assign(state, { step: 'topics', authority: false, party: null, robot: null, swapped: false, independent });
  if (!independent) state.topics = [];
  history = [];
  render();
  main.focus({ preventScroll: true });
}

function frame(content, { stage = 'השאלון שלך', hideProgress = false } = {}) {
  const { current, total } = progress(state.step, mouseAvailable);
  const label = current ? `שאלה ${current} ${total ? `מתוך ${total}` : 'מתוך כמה שצריך'}` : stage;
  return `<section class="card" aria-label="${label}">
    <div class="card-meta"><span class="step-label">${label}</span><span>${total ? 'מצאנו קיצור דרך' : 'בקצב שלך'}</span></div>
    ${hideProgress ? '' : `<div class="progress" aria-hidden="true"><span style="width:${total ? current / total * 100 : 14}%"></span></div>`}
    ${content}</section>
    <p class="under-card"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="currentColor"/><path d="M5 7V4a3 3 0 0 1 6 0v3" stroke="currentColor"/></svg>התשובות נשארות בעמוד הזה. אין צורך להירשם.</p>`;
}

function actions(nextLabel = 'ממשיכים', disabled = false, allowBack = true) {
  return `<div class="actions">${allowBack ? '<button class="back" data-action="back">→ חזרה</button>' : ''}<button class="primary" data-action="next" ${disabled ? 'disabled' : ''}>${nextLabel}<span aria-hidden="true">←</span></button></div>`;
}

function topicsView() {
  return frame(`<h2>מה הכי חשוב לך?</h2>
    <p class="description">אפשר לבחור כמה נושאים. אין תשובה נכונה,<br>ו״הכול חשוב״ זו בהחלט תחושה מוכרת.</p>
    ${state.independent ? '<p class="pending" role="status">מתחילים מהעמדות שלך. המסלול הזה עדיין בבנייה.</p>' : ''}
    <div class="topics" role="group" aria-label="הנושאים שחשובים לי">
      ${TOPICS.map(topic => `<label class="choice"><input type="checkbox" name="topic" value="${topic.id}" ${state.topics.includes(topic.id) ? 'checked' : ''} ${state.authority ? 'disabled' : ''}><span class="choice-icon" aria-hidden="true">${topic.icon}</span><span class="choice-copy"><strong>${topic.title}</strong><small>${topic.detail}</small></span><span class="check" aria-hidden="true">✓</span></label>`).join('')}
    </div>
    <div class="or">או שיש לך דרך אחרת לבחור</div>
    <label class="choice authority"><input type="checkbox" name="authority" ${state.authority ? 'checked' : ''}><span class="choice-icon" aria-hidden="true">☏</span><span class="choice-copy"><strong>אני הולך עם מישהו שאני סומך עליו</strong><small>רב, משפחה, ראש קהילה, עיתונאי או אדם אחר</small></span><span class="check" aria-hidden="true">✓</span></label>
    <p class="selection-note" role="status">${state.authority ? 'הבנתי, נקצר לך את התהליך. אפשר לבטל ולחזור לנושאים.' : state.topics.length ? `${state.topics.length} נושאים על השולחן. זו התחלה טובה.` : 'לא חייבים לפתור את הכול בבת אחת.'}</p>
    ${actions('בואו נתחיל', !state.authority && !state.topics.length, false)}`);
}

function partyView() {
  return frame(`<h2>ומה ההמלצה שקיבלת?</h2><p class="description">איזה פתק האדם שסומכים עליו מציע לשים בקלפי?<br>רק כדי שנהיה באותו עמוד. ובאותן אותיות.</p>
    <label class="sr-only" for="party-search">חיפוש לפי שם הרשימה או אותיות הפתק</label><input class="search" id="party-search" type="search" placeholder="חיפוש לפי שם או אותיות הפתק…" autocomplete="off">
    <div class="party-grid" role="radiogroup" aria-label="פתקי ההצבעה">${partyOptions('')}</div>
    <p class="selection-note" id="party-selection" role="status">${state.party ? `הפתק שבחרת: ${escape(state.party[1])} (${escape(state.party[0])})` : 'כל הפתקים באותו גודל. כאן לפחות.'}</p>
    ${actions('הפתק הזה, ממשיכים', !state.party)}
    <details class="source-note"><summary>מאיפה הפתקים?</summary><p>38 רשימות לפי <a href="https://bechirot.fyi/lists/26" target="_blank" rel="noopener noreferrer">bechirot.fyi</a>, שנבדקו ב־21.10.2026. השמות קוצרו לתצוגה. נתוני אבטיפוס ממקור משני; יש לאמת מול <a href="https://www.gov.il/he/pages/candidates-lists-26" target="_blank" rel="noopener noreferrer">ועדת הבחירות</a> לפני השקה.</p></details>`);
}

function partyOptions(query) {
  const filtered = PARTIES.filter(party => party.join(' ').normalize('NFKC').toLocaleLowerCase('he').includes(query.trim().normalize('NFKC').toLocaleLowerCase('he')));
  return filtered.length ? filtered.map(party => `<label class="ballot"><input type="radio" name="party" value="${escape(party[0])}" ${state.party?.[0] === party[0] ? 'checked' : ''}><span class="ballot-letter">${escape(party[0])}</span><span class="ballot-name">${escape(party[1])}</span></label>`).join('') : '<p class="empty" role="status">לא נמצא פתק כזה. ננסה שם אחר או את אותיות הרשימה?</p>';
}

function robotView() {
  return frame(`<div class="large-symbol" aria-hidden="true">⌘</div><h2>רגע, האם אתה רובוט?</h2><p class="description">שאלת שגרה. גם אנחנו נדרשים לפעמים<br>לזהות רמזורים כדי להוכיח משהו על עצמנו.</p>
    <div class="answer-options"><button class="answer" data-action="robot-no"><span>לא, יש כאן בן אדם<small>כולל התלבטויות והכול</small></span><span aria-hidden="true">←</span></button><button class="answer" data-action="robot-yes"><span>כן, ותודה ששאלתם<small>גם לרובוטים מגיע יחס אישי</small></span><span aria-hidden="true">←</span></button></div>
    <p class="aside-joke">זו רק בדיחה, אין כאן בדיקת אבטחה.</p><button class="back" data-action="back">→ חזרה</button>`);
}

function sureView() {
  return frame(`<div class="large-symbol" aria-hidden="true">?</div><h2>בטוח שאתה לא רובוט?</h2><p class="description">בדיקה אחרונה. מבטיחים לא לבקש<br>לסמן את כל התמונות עם האופניים.</p>
    <div class="answer-options"><button class="answer" id="sure-button" data-action="finish"><span id="sure-label">אני בטוח</span><span aria-hidden="true">←</span></button><button class="answer" data-action="finish">אפשר פשוט להמשיך?<span aria-hidden="true">←</span></button></div>
    <p class="aside-joke" id="sure-note" role="status">${state.swapped ? 'הכפתור שינה את דעתו. זה קורה. אפשר ללחוץ ולהמשיך.' : 'גם ביטחון עצמי הוא התחלה.'}</p><button class="back" data-action="back">→ חזרה</button>`);
}

function loadingView() {
  return `<section class="card loading-card" aria-live="polite" aria-busy="true"><div class="loading-ballot" aria-hidden="true">✓</div><h2>מחשב את התוצאות שלך…</h2><p class="description" id="loading-message">${state.robot === 'yes' ? 'תודה על הכנות. מעבד למעבד, מעריכים את זה.' : 'עובר על התשובות. עושה פרצוף רציני.'}</p><p class="aside-joke">במקרה הזה, קיבלנו ממך כיוון די ברור.</p></section>`;
}

function resultView() {
  // This result repeats the user's input; it does not score or endorse a party.
  const [letters, name] = state.party;
  return frame(`<div class="result-top"><span aria-hidden="true">✓</span> התוצאה שלך מוכנה</div><h2>הפתק כבר היה אצלך.</h2><p class="description">לפי המסלול שבחרת, הגענו ל־${escape(name)}.<br>לפעמים החישוב קצר יותר מהדרך לקלפי.</p>
    <div class="result-ballot"><strong>${escape(letters)}</strong><span>${escape(name)}</span></div>
    <div class="reason"><strong>השיקול שהוביל לתוצאה</strong>זו ההמלצה של האדם שבחרת לסמוך עליו.</div>
    <p class="value-note"><b>ועכשיו, שאלה ששווה לקחת איתך:</b>מה חשוב לך שהנציגים שלך יעשו בפועל?<br>גם כשסומכים על מישהו, יש מקום לשאול למה.</p>
    <p class="description">התוצאה משקפת את הבחירה שהזנת. עדיין לא השווינו עמדות או מצעים.</p>
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button><button class="text-button" data-action="restart">להתחיל שוב, עם דף חלק</button>`, { stage: 'הפתק שבחרת', hideProgress: true });
}

function prioritiesView() {
  return frame(`<span class="pending">מכאן ממשיכים לבנות יחד</span><h2>יש לנו סדר יום. זו התחלה.</h2><p class="description">אלה הדברים שבחרת לשים במרכז:</p>
    <div class="tags">${state.topics.map(id => `<span class="tag">${TOPICS.find(topic => topic.id === id).title}</span>`).join('')}</div>
    <p class="value-note"><b>נושא הוא התחלה, עמדה היא השלב הבא.</b>שני אנשים יכולים לבחור ״יוקר המחיה״ ולרצות פתרונות שונים לגמרי. השאלות הבאות יבררו מה היית רוצה שישתנה ואילו פשרות מקובלות עליך.</p>
    <p class="description">המסלול הזה עדיין בפיתוח, ולכן אין כאן עדיין התאמה למפלגה. בינתיים אפשר לשנות את הנושאים או לנסות את המסלול הקצר.</p>
    <button class="primary" data-action="edit-topics">חזרה לדברים שחשובים לי <span aria-hidden="true">↻</span></button>`, { stage: 'מה שחשוב לך', hideProgress: true });
}

function render() {
  const views = { topics: topicsView, party: partyView, robot: robotView, sure: sureView, loading: loadingView, result: resultView, priorities: prioritiesView };
  app.innerHTML = views[state.step]();
  if (state.step === 'sure') {
    if (state.swapped) document.querySelector('#sure-label').textContent = 'עזוב, לא משנה';
    document.querySelector('#sure-button').addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || state.swapped) return;
      state.swapped = true;
      document.querySelector('#sure-label').textContent = 'עזוב, לא משנה';
      document.querySelector('#sure-note').textContent = 'הכפתור שינה את דעתו. זה קורה. אפשר ללחוץ ולהמשיך.';
    });
  }
  if (state.step === 'loading') {
    timers.push(setTimeout(() => {
      document.querySelector('#loading-message').textContent = 'זה לא כזה קשה במקרה הזה…';
    }, 1100));
    timers.push(setTimeout(() => { go('result'); }, 2500));
  }
}

app.addEventListener('change', event => {
  const input = event.target;
  if (input.name === 'topic' || input.name === 'authority') {
    if (input.name === 'authority') state.authority = input.checked;
    else state.topics = toggleTopic(state.topics, input.value);
    const name = input.name;
    const value = input.value;
    render();
    [...app.querySelectorAll('input')].find(element => element.name === name && element.value === value)?.focus({ preventScroll: true });
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
  else if (action === 'restart') restart();
  else if (action === 'independent') restart(true);
  else if (action === 'edit-topics') go('topics');
  else if (action === 'next') {
    if (state.step === 'topics' && (state.authority || state.topics.length)) go(state.authority ? 'party' : 'priorities');
    else if (state.step === 'party' && state.party) go('robot');
  } else if (action === 'robot-no' || action === 'robot-yes') {
    state.robot = action === 'robot-no' ? 'no' : 'yes';
    go(afterRobot(state.robot, mouseAvailable));
  } else if (action === 'finish') go('loading');
});

render();
