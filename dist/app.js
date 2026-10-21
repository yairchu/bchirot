import { CUTSCENE_DURATION, MOBILE_CONFIRM_DELAY, EASTER_EGG_DURATION, NO_TOPICS_DURATION, TOPIC_CHOICES, afterRobot, progress } from './flow.js';
import { BALLOT_CHOICES, BLANK_BALLOT, BLANK_BALLOT_SOURCE, FAKE_BALLOT, PARTY_NOTICES } from './parties.js';
import { BRIDGE_DILEMMA, WEEKEND_DILEMMA } from './dilemmas.js';
import { BASIS_LABELS } from './scoring.js';
import { scoreCurrentReligion, unscoredCurrentLists, UNMAPPED_HISTORY, MAPPING_CHECKED_ON } from './current-lists.js';

const app = document.querySelector('#app');
const main = document.querySelector('#main');
const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)').matches;
const state = { step: 'welcome', topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null, weekendAnswer: null };
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
  if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ behavior: 'auto', block: 'start' });
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
  Object.assign(state, { step, topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null, weekendAnswer: null });
  saveHistory();
  render();
  focusQuestion();
}

function frame(content, { stage = '', heading = 'h2', className = '' } = {}) {
  const { current, total } = progress(state.step);
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
    ${actions('ממשיכים')}` });
}

function noTopicsView() {
  return frame({ title: 'גם לבחור מה חשוב זו החלטה.', body: '<p class="description">נתחיל מהדילמות. אולי בדרך יתברר.</p>' });
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
  return frame({ title: 'הלכת על קקה.', body: '<p class="description">אתה בטוח שאתה יודע מה אתה עושה?</p><p class="description">אין באמת מפלגה כזו. אנחנו רק מנסים לוודא שאתה בקיא בחומר.</p>' });
}

function sureView() {
  return frame({ title: 'האם אתה בטוח?', body: `
    <div class="answer-options"><button type="button" class="answer cutscene-option" id="sure-button" aria-describedby="cutscene-help"><span id="sure-label">אני בטוח</span></button></div>
    <span class="sr-only" id="cutscene-help">${mouseAvailable ? 'מעבר עכבר או מיקוד מקלדת יפעילו קטע קצר שימשיך אוטומטית.' : 'הקטע ימשיך אוטומטית בעוד רגע.'}</span>
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
  const notice = PARTY_NOTICES[letters];
  if (notice?.kind === 'withdrawn') return withdrawnResultView(name, notice);
  const blank = letters === BLANK_BALLOT[0];
  return frame({ title: `הפתק שלך: ${escape(name)}`, body: `
    <div class="result-ballot">${blank ? '<span class="sr-only">פתק לבן ריק</span>' : `<strong>${escape(letters)}</strong><span>${escape(name)}</span>`}</div>
    <p class="reason"><strong>השיקול שהוביל לתוצאה</strong>זו ההמלצה של האדם שבחרת לסמוך עליו.</p>
    ${blank ? blankBallotNote() : ''}
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button><button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'התוצאה שלך' });
}

function withdrawnResultView(name, notice) {
  return frame({ title: 'יש לנו משהו לספר לך', body: `
    <p class="description">״${escape(name)}״ הודיעה על פרישה מההתמודדות בבחירות.</p>
    <p class="source-note"><a href="${notice.sourceUrl}" target="_blank" rel="noopener noreferrer">לפרטים נוספים (${escape(notice.sourceLabel)})</a></p>
    <p class="description">מומלץ לשאול את האדם שבחרת לסמוך עליו להמלצה עדכנית.</p>
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button>
    <button class="text-button" data-action="update-recommendation">יש לי המלצה עדכנית</button>` }, { stage: 'עדכון על הרשימה שבחרת', className: 'withdrawn-result' });
}

function bridgeView() {
  return dilemmaView(BRIDGE_DILEMMA, 'bridgeAnswer', 'bridge-answer', 'זה קרה בגשר יהודית', 'ממשיכים');
}

function weekendView() {
  return dilemmaView(WEEKEND_DILEMMA, 'weekendAnswer', 'weekend-answer', 'נעים בסופ״ש: הרקע והאפשרויות', 'לתוצאות');
}

function dilemmaView(dilemma, answerKey, inputName, backgroundTitle, nextLabel) {
  return frame({ title: dilemma.title, body: `
    <p class="description">${escape(dilemma.context)}</p>
    <div class="dilemma-options" role="radiogroup" aria-label="${escape(dilemma.title)}">
      ${dilemma.options.map(option => `<label class="choice dilemma-option"><input type="radio" name="${inputName}" value="${option.id}" ${state[answerKey] === option.id ? 'checked' : ''}><span class="choice-copy"><strong>${escape(option.label)}</strong><small>${escape(option.detail)}</small></span></label>`).join('')}
    </div>
    <details class="dilemma-details"><summary>לפרטים נוספים</summary>
      <div class="dilemma-background"><h3>${escape(backgroundTitle)}</h3>
        ${dilemma.timeline.map(item => `<p>${escape(item.text)} <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escape(item.source)}</a>.</p>`).join('')}
      </div>
    </details>
    ${actions(nextLabel, !state[answerKey])}
    <button class="text-button" data-action="skip">לדלג על השאלה</button>` });
}

function currentContributionView(item) {
  return `<p><b>${escape(item.question)}: ${item.points > 0 ? '+' : ''}${item.points} נקודות.</b></p>${item.evidence.map(evidence => `<p><strong>${escape(evidence.name)} במקור ההיסטורי:</strong> ${escape(evidence.reason)}</p><p>${BASIS_LABELS[evidence.basis]} · <a href="${evidence.source}" target="_blank" rel="noopener noreferrer">מקור</a>${evidence.followupSource ? ` · <a href="${evidence.followupSource}" target="_blank" rel="noopener noreferrer">חידוש העבודות</a>` : ''}</p>`).join('')}`;
}

function bridgeResultView() {
  const scores = scoreCurrentReligion(state.bridgeAnswer, state.weekendAnswer);
  const answered = Number(Boolean(state.bridgeAnswer)) + Number(Boolean(state.weekendAnswer));
  if (!answered) return frame({ title: 'עוד אין לנו מספיק חומר.', body: '<p class="description">דילגת על שתי הדילמות. נשאיר את האפשרויות פתוחות.</p><button class="primary" data-action="review-questions">בחזרה לשאלות <span aria-hidden="true">↻</span></button><button class="text-button" data-action="restart">להתחיל מחדש</button>' });
  return frame({ title: 'איפה התשובה שלך פוגשת את המפלגות?', body: `
    <p class="description">ענית על ${answered} מתוך 2 דילמות. דילוגים לא נכללים בניקוד.</p>
    <p class="score-context">הרשימות מוצגות בשמותיהן ובאותיות הפתק הנוכחיות, לפי מיפוי ההיסטוריה המפלגתית. הניקוד מבוסס על התנהלות בעבר, ולא בהכרח על עמדת הרשימה כיום. תחילה מוצגות מפלגות שיש להן מקורות לכל התשובות שלך, ואחריהן אלה עם מידע חלקי.</p>
    <table class="score-table"><caption class="sr-only">ניקוד המפלגות לפי התשובות בדת ותחבורה</caption>
      <thead><tr><th scope="col">מפלגה</th><th scope="col">נקודות</th></tr></thead>
      <tbody>${scores.map(party => `<tr data-party-id="${party.id}"><th scope="row"><strong>${escape(party.name)} · ${escape(party.letters)}</strong><small class="score-coverage">מקורות ל־${party.contributions.length} מתוך ${answered} תשובות</small><details><summary>למה?</summary><p>${escape(party.note)} <a href="${party.source}" target="_blank" rel="noopener noreferrer">מקור המיפוי</a>.</p>${party.contributions.map(currentContributionView).join('')}</details></th><td><bdi class="score ${party.points > 0 ? 'score-positive' : party.points < 0 ? 'score-negative' : ''}">${party.points > 0 ? '+' : party.points < 0 ? '−' : ''}${Math.abs(party.points)}</bdi></td></tr>`).join('')}</tbody>
    </table>
    <details class="score-method"><summary>איך הניקוד עובד?</summary><p>בשאלת הגשר: משקל 2 לעמדה מתועדת ומשקל 1 להתנהלות מעורבת או להערכת אחריות קואליציונית. בנעים בסופ״ש: ציר של איסור, מצב קיים והרחבה. עמדה באותה קטגוריה מקבלת 2, קטגוריה סמוכה 0, והקצה ההפוך מינוס 2. הקטגוריות והמשקלים הם פרשנות במודל.</p><p>אפס הוא ציון של מרחק בין החלופות במודל, לא קביעה שהמפלגה נייטרלית. דילוג או היעדר מקור אינם מוסיפים ציון כלל. ההשוואה בנעים בסופ״ש עוסקת בכיוון המדיניות, ולא בהסכמה נפרדת לכל פרט כמו תעריף או סוג רכבת. באיחוד רשימות מחושב ממוצע הציונים ההיסטוריים לכל שאלה, כדי לא להכפיל את משקלה. המקורות והשיוך ההיסטורי מפורטים תחת ״למה?״.</p></details>
    <details class="score-method"><summary>מי עדיין לא נכלל בהשוואה?</summary><p>לרשימות הבאות אין כרגע ניקוד לתשובות שלך; היעדר מידע אינו עמדה נייטרלית:</p><p>${unscoredCurrentLists(scores).map(([letters, name]) => `${escape(name)} (${escape(letters)})`).join(' · ')}</p>${UNMAPPED_HISTORY.map(item => `<p>${escape(item.reason)}</p>`).join('')}<p>המיפוי נבדק ב־${MAPPING_CHECKED_ON}. רשימות שהודיעו על פרישה אינן נכללות בתוצאות.</p></details>
    ${state.topics.includes('todo-2') ? '<p class="todo"><span class="todo-label">TODO</span> · הנושא הנוסף שבחרת עדיין לא נכלל בחישוב.</p>' : ''}
    <div class="actions"><button class="primary" data-action="review-questions">לעבור שוב על השאלות <span aria-hidden="true">↻</span></button><button class="back" data-action="back">חזרה</button></div><button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'דת ותחבורה · תוצאות' });
}

function independentView() {
  // TODO: Continue the topic flow with more dilemmas and sourced comparisons.
  const religionTransport = state.topics.includes('religion-transport');
  return frame({ title: religionTransport ? 'דת ותחבורה' : 'השאלות לפי העמדות שלך', body: `<p class="todo"><span class="todo-label">TODO</span> · ${religionTransport ? 'להוסיף את הדילמה הבאה ולבנות את המשך המסלול.' : 'לכתוב את השאלות ולבנות את המסלול.'}</p><button class="primary" data-action="topics">חזרה להתחלה <span aria-hidden="true">↻</span></button>` });
}

function render() {
  const views = { welcome: welcomeView, topics: topicsView, 'no-topics': noTopicsView, bridge: bridgeView, weekend: weekendView, 'bridge-result': bridgeResultView, party: partyView, 'fake-ballot': fakeBallotView, robot: robotView, 'robot-thanks': robotThanksView, sure: sureView, loading: loadingView, result: resultView, independent: independentView };
  app.innerHTML = views[state.step]();
  if (state.step === 'no-topics') timers.push(setTimeout(() => go('bridge', true), NO_TOPICS_DURATION));
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
    if (mouseAvailable) option.addEventListener('focus', startCutscene);
    else timers.push(setTimeout(startCutscene, MOBILE_CONFIRM_DELAY));
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
  } else if (input.name === 'topic') {
    state.topics = [...app.querySelectorAll('[name="topic"]:checked')].map(topic => topic.value);
  } else if (input.name === 'party') {
    state.party = BALLOT_CHOICES.find(party => party[0] === input.value);
    document.querySelector('[data-action="next"]').disabled = false;
    document.querySelector('#party-selection').textContent = `הפתק שבחרת: ${state.party[1]}${state.party[0] === BLANK_BALLOT[0] ? '' : ` (${state.party[0]})`}`;
    document.querySelector('#blank-ballot-note').hidden = state.party[0] !== BLANK_BALLOT[0];
  } else if (['bridge-answer', 'weekend-answer'].includes(input.name)) {
    state[input.name === 'bridge-answer' ? 'bridgeAnswer' : 'weekendAnswer'] = input.value;
    document.querySelector('[data-action="next"]').disabled = false;
  }
  if (['authority', 'topic', 'party', 'bridge-answer', 'weekend-answer'].includes(input.name)) saveHistory();
});

app.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') back();
  else if (action === 'start') go('topics');
  else if (action === 'restart') restart();
  else if (action === 'independent') restart();
  else if (action === 'topics') restart('topics');
  else if (action === 'review-questions') go('bridge');
  else if (action === 'skip' && ['bridge', 'weekend'].includes(state.step)) {
    const bridge = state.step === 'bridge';
    state[bridge ? 'bridgeAnswer' : 'weekendAnswer'] = null;
    go(bridge ? 'weekend' : 'bridge-result');
  }
  else if (action === 'update-recommendation') {
    state.party = null;
    state.robot = null;
    state.cutscene = false;
    go('party');
  }
  else if (action === 'next') {
    if (state.step === 'topics') go(state.authority ? 'party' : !state.topics.length ? 'no-topics' : state.topics.includes('religion-transport') ? 'bridge' : 'independent');
    else if (state.step === 'party' && state.party) go(state.party[0] === FAKE_BALLOT[0] ? 'fake-ballot' : 'robot');
    else if (state.step === 'bridge' && state.bridgeAnswer) go('weekend');
    else if (state.step === 'weekend' && state.weekendAnswer) go('bridge-result');
  } else if (action === 'robot-no' || action === 'robot-yes') {
    state.robot = action === 'robot-no' ? 'no' : 'yes';
    go(afterRobot(state.robot));
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
