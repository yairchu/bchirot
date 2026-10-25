import { COALITION_PARTIES, coalitionWeight, scoreCoalitions } from './coalitions.js';
import { createQuizAnalytics } from './analytics.js';
import { CUTSCENE_DURATION, MOBILE_CONFIRM_DELAY, EASTER_EGG_DURATION, NO_TOPICS_DURATION, TOPIC_CHOICES, QUESTIONS, questionRoute, questionnaireQuestions, additionalQuestionCount, afterRobot, progress } from './flow.js';
import { BALLOT_CHOICES, BLANK_BALLOT, BLANK_BALLOT_SOURCE, FAKE_BALLOT, PARTY_NOTICES, THRESHOLD_OUTLOOK, thresholdStatus } from './parties.js';
import { BRIDGE_DILEMMA, WEEKEND_DILEMMA, EMERGENCY_DILEMMA, DREAM_QUESTION } from './dilemmas.js';
import { SERVICE_CHOICES, BURDEN_GROUPS, BURDEN_TIMELINE, DRAFT_DILEMMA, THREAT_DILEMMA, normalizeBurdenAnswer, burdenLevel, scoreBurden } from './policy-questions.js';
import { REPRESENTATION_DILEMMA, ACADEMIA_DILEMMA, WOMEN_SERVICE_DILEMMA, SIDEWALK_DILEMMA, MINORS_PROTECTION_DILEMMA, scoreMinorsProtection } from './partnership.js';
import { basisLabel } from './scoring.js';
import { scoreCurrentReligion, unscoredCurrentLists, MAPPING_CHECKED_ON } from './current-lists.js';

const analytics = createQuizAnalytics(window);
const app = document.querySelector('#app');
const main = document.querySelector('#main');
const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)').matches;
const state = { step: 'welcome', topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null, weekendAnswer: null, emergencyAnswer: null, dreamAnswer: null, draftAnswer: null, representationAnswer: null, academiaAnswer: null, womenServiceAnswer: null, sidewalkAnswer: null, childProtectionAnswer: null, burdenAnswer: null, burdenTasksAnswer: null, noArmy: false, noArmyAnswer: null, threatAnswer: null };
let timers = [];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function saveHistory(replace = false) {
  const snapshot = { ...state, topics: [...state.topics], party: state.party ? [...state.party] : null, burdenAnswer: state.burdenAnswer ? [...state.burdenAnswer] : null, burdenTasksAnswer: state.burdenTasksAnswer ? [...state.burdenTasksAnswer] : null };
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
  analytics.reset();
  Object.assign(state, { step, topics: [], authority: false, party: null, robot: null, cutscene: false, bridgeAnswer: null, weekendAnswer: null, emergencyAnswer: null, dreamAnswer: null, draftAnswer: null, representationAnswer: null, academiaAnswer: null, womenServiceAnswer: null, sidewalkAnswer: null, childProtectionAnswer: null, burdenAnswer: null, burdenTasksAnswer: null, noArmy: false, noArmyAnswer: null, threatAnswer: null });
  saveHistory();
  render();
  focusQuestion();
}

function frame(content, { stage = '', heading = 'h2', className = '' } = {}) {
  const { current, total } = progress(state.step, state);
  const label = current ? `שאלה ${current} ${total ? `מתוך ${total}` : 'מתוך כמה שצריך'}` : stage;
  return `<section class="screen ${className}" aria-labelledby="question-title">
    ${label ? `<div class="step-label">${label}</div>` : ''}
    <${heading} id="question-title">${content.title}</${heading}>
    ${content.body}</section>`;
}

function actions(nextLabel = 'ממשיכים', disabled = false, continuation = nextLabel) {
  return `<div class="actions"><button class="primary" data-action="next" data-continuation="${escape(continuation)}" ${disabled ? 'disabled' : ''}><span class="button-label">${nextLabel}</span><span aria-hidden="true">←</span></button><button class="back" data-action="back">חזרה</button></div>`;
}

function questionContinuation() {
  const questions = currentQuestions();
  return questions[questions.length - 1] === state.step ? 'לתוצאות' : 'ממשיכים';
}

function questionActions() {
  const nextLabel = questionContinuation();
  return actions(hasAnswer(state.step) ? nextLabel : 'דלג', false, nextLabel) + faqLink();
}

function faqLink() {
  return '<p class="selection-note about-link"><a href="about.html" target="_blank" rel="noopener noreferrer">שאלות נפוצות: למה דווקא השאלות האלה?<span class="sr-only"> (נפתח בלשונית חדשה)</span></a></p>';
}

function updateQuestionAction() {
  const next = app.querySelector('[data-action="next"]');
  next.disabled = false;
  next.dataset.continuation = questionContinuation();
  next.querySelector('.button-label').textContent = hasAnswer(state.step) ? next.dataset.continuation : 'דלג';
}

function welcomeView() {
  return frame({ title: 'תכלס, בחירות.', body: '<p class="description">השאלון שמבוסס על מעשים, לא על הצהרות</p><button class="primary" data-action="start">מתחילים <span aria-hidden="true">←</span></button>' }, { heading: 'h1' });
}

function topicsView() {
  // Topic costs and navigation both use the question catalog in flow.js.
  return frame({ title: 'איזה נושאים חשובים לך?', body: `
    <label class="choice authority"><input type="checkbox" name="authority" ${state.authority ? 'checked' : ''}><span class="choice-copy"><strong>כבר אמרו לי למי להצביע</strong><small>רב, משפחה, ראש קהילה, עיתונאי או אדם אחר</small><small class="authority-joke">יש לנו קיצור דרך בשבילך.</small></span></label>
    <div role="group" aria-label="נושאים לבחירה">
      ${TOPIC_CHOICES.map(({ id, label }) => `<label class="choice"><input type="checkbox" name="topic" value="${id}" ${state.topics.includes(id) ? 'checked' : ''} ${state.authority ? 'disabled' : ''}><span class="choice-copy"><strong><bdi>${escape(label)}</bdi> <span class="topic-count" data-topic-count="${id}">${topicCountLabel(id)}</span></strong></span></label>`).join('')}
    </div>
    <p class="selection-note" id="question-budget" role="status">${questionBudgetLabel()}</p>
    ${actions(state.authority || state.topics.length ? 'ממשיכים' : 'דלג')}` });
}

function topicCountLabel(id) {
  const count = additionalQuestionCount(id, state.topics);
  const subject = TOPIC_CHOICES.find(topic => topic.id === id).subject;
  return `(<bdi dir="ltr">+${count}</bdi> ${count === 1 ? 'שאלה' : 'שאלות'}${subject ? ` ${subject}` : ''})`;
}

function questionBudgetLabel() {
  if (state.authority) return 'מסלול קצר של 4 שאלות.';
  const count = questionRoute(state.topics).length;
  return count ? `בסך הכול: ${count + 1} שאלות, כולל השאלה הזו. שאלות משותפות מופיעות פעם אחת.` : 'אפשר לבחור כמה נושאים. המספר מציין כמה שאלות כל נושא מוסיף.';
}

function updateTopicSummary() {
  app.querySelector('.button-label').textContent = state.authority || state.topics.length ? 'ממשיכים' : 'דלג';
  for (const { id } of TOPIC_CHOICES) app.querySelector(`[data-topic-count="${id}"]`).innerHTML = topicCountLabel(id);
  app.querySelector('#question-budget').textContent = questionBudgetLabel();
  const { current, total } = progress(state.step, state);
  app.querySelector('.step-label').textContent = `שאלה ${current} ${total ? `מתוך ${total}` : 'מתוך כמה שצריך'}`;
}

function currentQuestions() {
  return questionnaireQuestions(state.topics, state);
}

function advanceQuestion() {
  const questions = currentQuestions();
  go(questions[questions.indexOf(state.step) + 1] || 'bridge-result');
}

function serviceAnswer() {
  return normalizeBurdenAnswer(state.burdenAnswer, false);
}

function tasksAnswer() {
  return state.topics.includes('war-dream') && !state.noArmy ? normalizeBurdenAnswer(state.burdenTasksAnswer).filter(id => !SERVICE_CHOICES.some(choice => choice.id === id)) : [];
}

function burdenAnswer() {
  return [...serviceAnswer(), ...tasksAnswer()];
}

function hasAnswer(id) {
  if (id === 'burden') return serviceAnswer().length > 0;
  if (id === 'burden-tasks') return tasksAnswer().length > 0;
  return Boolean(state[QUESTIONS[id].answerKey]);
}

function burdenImpact() {
  const selected = burdenAnswer();
  const serving = SERVICE_CHOICES.filter(choice => selected.includes(choice.id)).map(choice => choice.label);
  return [
    serving.length ? `חובת השירות שבחרת: ${serving.join(', ')}.` : '',
    selected.includes('limit-outposts') ? 'צמצום משימות הגנה על נקודות מבודדות.' : selected.includes('protect-outposts') ? 'הקצאת משאבי הגנה להתיישבות מבודדת.' : '',
    selected.includes('seek-partners') ? 'ניסיון לחלק משימות עם שותפים, בכפוף להצלחת שיתוף הפעולה.' : selected.includes('self-reliance') ? 'צה״ל יישא במשימות בלי שותפים.' : '',
  ].filter(Boolean).join(' ');
}

function currentBurdenLevel() {
  return burdenLevel(burdenAnswer(), true);
}

function burdenMeterView() {
  const level = currentBurdenLevel();
  return `<section class="burden-meter is-entering" aria-labelledby="burden-meter-title">
    <h3 id="burden-meter-title">מד הנטל על המשרתים</h3>
    <div class="burden-scale" aria-hidden="true"><span>פחות עומס</span><span>יותר עומס</span></div>
    <div id="burden-gauge" class="burden-track" role="meter" aria-labelledby="burden-meter-title" aria-valuemin="0" aria-valuemax="${level.max}" aria-valuenow="${level.value}" aria-valuetext="${escape(burdenMeterLabel(level))}"><span class="burden-fill" style="width: ${level.value / level.max * 100}%"></span></div>
    <p id="burden-meter-status" class="selection-note" role="status">${escape(burdenMeterLabel(level))}</p>
    <div class="burden-scenes" aria-hidden="true"><span>עוד סבב. העסק מחכה.</span><span>עוד סבב. בבית מסתדרים בלעדיך.</span></div>
    <p class="burden-disclaimer">המחשה לכיוון השינוי, לא תחזית לימי מילואים. הקטעים הם המחשה למחיר האישי.</p>
  </section>`;
}

function burdenDisplayView() {
  return `<div id="burden-meter-slot">${serviceAnswer().length ? burdenMeterView() : noArmyWarning()}</div>`;
}

function noArmyWarning() {
  return '<p class="no-army-warning" role="status">כרגע אף אחד לא בתורנות. זה משאיר אותנו קצת חשופים.</p>';
}

function burdenMeterLabel({ value, baseline, answered, total }) {
  const direction = !answered ? 'בחרו עמדה כדי להזיז את המד' : value < baseline ? 'כיוון של הקלה בנטל' : value > baseline ? 'כיוון של הכבדה בנטל' : 'הבחירות מושכות לכיוונים מנוגדים';
  return `${direction}. נבחרו ${answered} מתוך ${total} נושאים.`;
}

function updateBurdenMeter(previousValue) {
  const host = app.querySelector('#burden-meter-slot');
  if (!serviceAnswer().length) {
    host.innerHTML = noArmyWarning();
    return;
  }
  if (!host.querySelector('.burden-meter')) host.innerHTML = burdenMeterView();
  const level = currentBurdenLevel();
  const meter = app.querySelector('.burden-meter');
  const gauge = app.querySelector('#burden-gauge');
  gauge.setAttribute('aria-valuenow', level.value);
  gauge.setAttribute('aria-valuetext', burdenMeterLabel(level));
  gauge.querySelector('.burden-fill').style.width = `${level.value / level.max * 100}%`;
  app.querySelector('#burden-meter-status').textContent = burdenMeterLabel(level);
  meter.classList.remove('is-entering', 'is-rising', 'is-falling');
  const scenes = meter.querySelector('.burden-scenes');
  const relief = state.step === 'burden' ? 'יותר כתפיים לחלוק בנטל.' : 'פחות משימות על אותן כתפיים.';
  const lines = level.value < previousValue ? [relief, 'קצת יותר מקום לעסק ולבית.'] : ['עוד סבב. העסק מחכה.', 'עוד סבב. בבית מסתדרים בלעדיך.'];
  [...scenes.children].forEach((scene, index) => { scene.textContent = lines[index]; });
  // Restart the brief scene on each actual increase/decrease, including fast changes.
  void meter.offsetWidth;
  if (level.answered && level.value !== previousValue) meter.classList.add(level.value > previousValue ? 'is-rising' : 'is-falling');
}

function burdenDetails(expanded) {
  const timeline = [...BURDEN_TIMELINE.filter((item, index) => expanded || index === 0 || index === 4 || index === 5), ...(!expanded ? WOMEN_SERVICE_DILEMMA.timeline.slice(1) : [])];
  return `<details class="dilemma-details"><summary>לפרטים נוספים</summary><div class="dilemma-background">${timeline.map(item => `<p>${escape(item.text)} <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escape(item.source)}</a>.</p>`).join('')}</div></details>`;
}

function representationView() {
  return dilemmaView(REPRESENTATION_DILEMMA, 'representationAnswer', 'representation-answer', 'ייצוג נשים בפועל');
}

function minorsProtectionView() {
  return dilemmaView(MINORS_PROTECTION_DILEMMA, 'childProtectionAnswer', 'child-protection-answer', 'יבנאל: העדויות, האכיפה והקשרים');
}

function sidewalkView() {
  return dilemmaView(SIDEWALK_DILEMMA, 'sidewalkAnswer', 'sidewalk-answer', 'הפרדה במדרכות: המקרה והעתירה');
}

function womenServiceView() {
  return dilemmaView(WOMEN_SERVICE_DILEMMA, 'womenServiceAnswer', 'women-service-answer', 'שירות נשים: התאמה ושיבוץ בפועל');
}

function academiaView() {
  return dilemmaView(ACADEMIA_DILEMMA, 'academiaAnswer', 'academia-answer', 'הפרדה באקדמיה: ההחלטה והמחלוקת');
}

function draftView() {
  return dilemmaView(DRAFT_DILEMMA, 'draftAnswer', 'draft-answer', 'גיוס ולימוד תורה');
}

function burdenView() {
  const selected = serviceAnswer();
  return frame({ title: 'מי צריך לשרת בצבא?', body: `
    <fieldset class="service-group"><legend class="sr-only">מי צריך לשרת בצבא?</legend>
      <div class="service-options">${SERVICE_CHOICES.map(choice => `<label class="choice burden-choice"><input type="checkbox" name="burden-answer" data-burden-group="service" value="${choice.id}" ${selected.includes(choice.id) ? 'checked' : ''}><span class="choice-copy"><strong>${escape(choice.label)}</strong></span></label>`).join('')}</div>
      <p class="selection-note">בתרחיש שלך ישרתו הקבוצות שסומנו, לפי התאמה לתפקיד. המשך בלי סימון מוביל לתרחיש ללא צבא.</p>
    </fieldset>
    ${burdenDisplayView()}<p class="sr-only" id="burden-impact" role="status">${burdenImpact()}</p>
    ${burdenDetails(false)}${questionActions()}` }, { className: 'burden-screen' });
}

function burdenTasksView() {
  const selected = tasksAnswer();
  return frame({ title: 'אילו משימות הצבא צריך לשאת?', body: `
    ${BURDEN_GROUPS.map(group => `<fieldset class="burden-group"><legend>${escape(group.title)}</legend>${group.note ? `<p class="selection-note">${escape(group.note)}</p>` : ''}<div class="burden-options">${group.options.map(option => `<label class="choice burden-choice"><input type="checkbox" name="burden-tasks-answer" data-burden-group="${group.id}" value="${option.id}" ${selected.includes(option.id) ? 'checked' : ''}><span class="choice-copy"><strong>${escape(option.label)}</strong></span></label>`).join('')}</div></fieldset>`).join('')}
    ${burdenDisplayView()}<p class="sr-only" id="burden-impact" role="status">${burdenImpact()}</p>
    ${burdenDetails(true)}${questionActions()}` }, { className: 'burden-screen' });
}

function noArmyView() {
  return frame({ title: 'בחרת שלא יהיה צבא. איך נישאר מוגנים?', body: `
    <button class="answer" data-action="no-army-faith">אלוהים ישמור</button>
    <button class="answer" data-action="no-army-unsure">לא יודע, לא נראה לי קריטי</button>
    <button class="text-button" data-action="choose-service">רגע, נחזור לבחירת המשרתים</button>` });
}

function threatView() {
  return dilemmaView(THREAT_DILEMMA, 'threatAnswer', 'threat-answer', 'חמאס, הרשות וסדרי העדיפויות');
}

function dreamView() {
  return dilemmaView(DREAM_QUESTION, 'dreamAnswer', 'dream-answer', '');
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
  const outlook = thresholdStatus(letters);
  const thresholdWarning = outlook === 'borderline' || outlook === 'unlikely';
  return frame({ title: `הפתק שלך: ${escape(name)}`, body: `
    <div class="result-ballot">${blank ? '<span class="sr-only">פתק לבן ריק</span>' : `<strong>${escape(letters)}</strong><span>${escape(name)}</span>`}</div>
    <p class="reason"><strong>השיקול שהוביל לתוצאה</strong>זו ההמלצה של האדם שבחרת לסמוך עליו.</p>
    ${blank ? blankBallotNote() : thresholdWarning ? thresholdRiskNote(outlook, letters) : ''}
    <button class="primary" data-action="independent">בואו נבדוק גם לפי העמדות שלי <span aria-hidden="true">↻</span></button>
    ${thresholdWarning ? '<button class="text-button" data-action="update-recommendation">יש לי המלצה עדכנית</button>' : ''}
    <button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'התוצאה שלך' });
}

function thresholdRiskNote(outlook, letters) {
  const evidence = THRESHOLD_OUTLOOK.borderlineEvidence[letters];
  const sources = evidence ? [...THRESHOLD_OUTLOOK.sources, evidence.source] : THRESHOLD_OUTLOOK.sources;
  const warning = evidence?.warning ?? (outlook === 'borderline'
    ? 'זהירות: הרשימה הזו מתנדנדת סביב אחוז החסימה. בחלק מהסקרים שבדקנו היא עוברת אותו, ובאחרים לא.'
    : 'אזהרה: הרשימה הזו לא צפויה לעבור את אחוז החסימה, לפי תמונת הסקרים שבדקנו.');
  return `<aside class="threshold-note" aria-label="סיכון באחוז החסימה">
    <p class="description"><strong>${escape(warning)}</strong></p>
    <p class="description">רשימה שלא תעבור את אחוז החסימה לא תשתתף בחלוקת המנדטים. מומלץ לחזור לאדם שבחרת לסמוך עליו ולוודא שההמלצה מביאה בחשבון את הסיכון הזה.</p>
    <p class="selection-note">סקרים אינם תוצאות הבחירות. תמונת הסקרים מ־${THRESHOLD_OUTLOOK.publishedOn.split('-').reverse().join('.')}; נבדקה ב־${THRESHOLD_OUTLOOK.checkedOn.split('-').reverse().join('.')}.</p>
    <p class="source-note"><a href="https://www.gov.il/he/pages/election-about-info?chapterindex=4" target="_blank" rel="noopener noreferrer">מה זה אחוז החסימה?</a></p>
    <details class="source-note"><summary>הסקרים שבדקנו</summary><ul>${sources.map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a></li>`).join('')}</ul></details>
  </aside>`;
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
  return dilemmaView(BRIDGE_DILEMMA, 'bridgeAnswer', 'bridge-answer', 'זה קרה בגשר יהודית');
}

function weekendView() {
  return dilemmaView(WEEKEND_DILEMMA, 'weekendAnswer', 'weekend-answer', 'נעים בסופ״ש: הרקע והאפשרויות');
}

function emergencyView() {
  return dilemmaView(EMERGENCY_DILEMMA, 'emergencyAnswer', 'emergency-answer', 'ההגעה ללחימה ולחילוץ ב־7 באוקטובר');
}

function dilemmaView(dilemma, answerKey, inputName, backgroundTitle) {
  return frame({ title: dilemma.title, body: `
    ${dilemma.context ? `<p class="description">${escape(dilemma.context)}</p>` : ''}
    ${dilemma.note ? `<p class="selection-note">${escape(dilemma.note)}</p>` : ''}
    <div class="dilemma-options" role="radiogroup" aria-label="${escape(dilemma.title)}">
      ${dilemma.options.map(option => `<label class="choice dilemma-option"><input type="radio" name="${inputName}" value="${option.id}" ${state[answerKey] === option.id ? 'checked' : ''}><span class="choice-copy"><strong>${escape(option.label)}</strong>${option.detail ? `<small>${escape(option.detail)}</small>` : ''}</span></label>`).join('')}
    </div>
    ${dilemma.timeline.length ? `<details class="dilemma-details"><summary>לפרטים נוספים</summary>
      <div class="dilemma-background"><h3>${escape(backgroundTitle)}</h3>
        ${dilemma.timeline.map(item => `<p>${escape(item.text)} <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escape(item.source)}</a>.</p>`).join('')}
      </div>
    </details>` : ''}
    ${questionActions()}` });
}

function currentContributionView(item) {
  return `<p><b>${escape(item.question)}: ${item.points > 0 ? '+' : ''}${item.points} נקודות.</b></p>${item.evidence.map(evidence => `<p><strong>${escape(evidence.name)} ${evidence.basis === 'vision' ? 'בחזון המוצהר' : evidence.basis === 'composition' ? 'ברשימה שהוגשה' : ['action', 'partial-action', 'sustained-action', 'legislative-opposition'].includes(evidence.basis) ? 'במעשה המתועד' : ['policy', 'interpretation'].includes(evidence.basis) ? 'בעמדה המתועדת' : 'במקור ההיסטורי'}:</strong> ${evidence.component ? `${escape(evidence.component)} (${evidence.points > 0 ? '+' : ''}${evidence.points}): ` : ''}${escape(evidence.reason)}</p><p>${basisLabel(evidence)} · <a href="${evidence.source}" target="_blank" rel="noopener noreferrer">מקור</a>${evidence.followupSource ? ` · <a href="${evidence.followupSource}" target="_blank" rel="noopener noreferrer">${escape(evidence.followupLabel || 'חידוש העבודות')}</a>` : ''}</p>`).join('')}`;
}

function dreamSummary() {
  if (!currentQuestions().includes('dream') || !state.dreamAnswer) return '';
  const option = DREAM_QUESTION.options.find(option => option.id === state.dreamAnswer);
  if (!option) return '';
  return `<p class="dream-summary selection-note">החלום שבחרת: ${escape(option.label)}. זיקה לחזון מוצהר נספרת במשקל נקודה אחת.</p>`;
}

// Equal scores share one rank: the score cell spans the tied rows, so the
// alphabetical order within a tie does not read as a ranking. The score is
// pinned while scrolling, since a large tie can be taller than the screen.
function tiers(parties) {
  const result = [];
  for (const party of parties) {
    const last = result.at(-1);
    if (last && last[0].points === party.points) last.push(party);
    else result.push([party]);
  }
  return result;
}

function scoreGroupsView(scores, answered) {
  const groups = [
    { key: 'positive', title: 'נקודות התאמה', matches: points => points > 0, note: 'רשימות עם סכום חיובי לפי התשובות והמקורות שנבדקו.' },
    { key: 'neutral', title: 'ללא יתרון בניקוד', matches: points => points === 0, note: 'סכום אפס אינו המלצה או היעדר מידע; אפשר לפתוח את פירוט הנקודות.' },
    { key: 'negative', title: 'נקודות מחלוקת', matches: points => points < 0, note: 'הרשימות כאן מוצגות בגלל פער מול התשובות שלך. הציון השלילי אינו התאמה חיובית.' },
  ];
  return groups.map(({ key, title, matches, note }) => {
    const parties = scores.filter(party => matches(party.points));
    if (!parties.length) return '';
    return `<section class="score-group" data-score-group="${key}" aria-labelledby="scores-${key}"><h3 id="scores-${key}">${title}</h3><p class="selection-note">${note}</p><table class="score-table"><caption class="sr-only">${title}</caption>
      <thead><tr><th scope="col">מפלגה</th><th scope="col">נקודות</th></tr></thead>
      ${tiers(parties).map(tier => `<tbody class="score-tier"${tier.length > 1 ? ` data-tied="${tier.length}"` : ''}>${tier.map((party, index) => `<tr data-party-id="${party.id}"><th scope="row"><strong>${escape(party.name)} · ${escape(party.letters)}</strong><small class="score-coverage">מקורות ל־${party.contributions.length} מתוך ${answered} תשובות</small><details><summary>למה?</summary><p>${escape(party.note)} <a href="${party.source}" target="_blank" rel="noopener noreferrer">מקור המיפוי</a>.</p>${party.contributions.map(currentContributionView).join('')}</details></th>${index ? '' : `<td${tier.length > 1 ? ` rowspan="${tier.length}"` : ''}>${tier.length > 1 ? '<div class="score-pin">' : ''}<bdi class="score ${party.points > 0 ? 'score-positive' : party.points < 0 ? 'score-negative' : ''}">${party.points > 0 ? '+' : party.points < 0 ? '−' : ''}${Math.abs(party.points)}</bdi>${tier.length > 1 ? '<small class="score-shared">ציון זהה</small>' : ''}${tier.length > 1 ? '</div>' : ''}</td>`}</tr>`).join('')}</tbody>`).join('')}
    </table></section>`;
  }).join('');
}

function currentScoreContext() {
  const questions = currentQuestions();
  const activeAnswer = id => !questions.includes(id) ? null : id === 'burden' ? (serviceAnswer().length ? serviceAnswer() : null) : id === 'burden-tasks' ? (tasksAnswer().length ? tasksAnswer() : null) : state[QUESTIONS[id].answerKey];
  const scores = scoreCurrentReligion(activeAnswer('bridge'), activeAnswer('weekend'), activeAnswer('emergency'), activeAnswer('dream'), { childProtectionAnswer: activeAnswer('child-protection'), sidewalkAnswer: activeAnswer('sidewalk'), womenServiceAnswer: activeAnswer('women-service'), representationAnswer: activeAnswer('representation'), academiaAnswer: activeAnswer('academia'), draftAnswer: activeAnswer('draft'), burdenAnswer: activeAnswer('burden'), burdenTasksAnswer: activeAnswer('burden-tasks'), threatAnswer: activeAnswer('threat') });
  return { questions, activeAnswer, scores };
}

// Build method examples from the same records as the actual results.
function scoreTotalsText(records) {
  const totals = new Map();
  for (const record of records) {
    if (!totals.has(record.id)) totals.set(record.id, { name: record.name, points: 0 });
    totals.get(record.id).points += record.points;
  }
  return [...totals.values()].map(({ name, points }) => `${escape(name)}: <bdi>${points > 0 ? '+' : points < 0 ? '−' : ''}${Math.abs(points)}</bdi>`).join(' · ');
}

function bridgeResultView() {
  const { questions, activeAnswer, scores } = currentScoreContext();
  const scoredQuestions = questions.filter(id => QUESTIONS[id].scored);
  const answered = scoredQuestions.filter(id => Boolean(activeAnswer(id))).length;
  const dream = dreamSummary();
  const womenService = WOMEN_SERVICE_DILEMMA.options.find(option => option.id === activeAnswer('women-service'));
  const womenServiceSummary = womenService ? `<p class="selection-note women-service-summary">שירות נשים בצה״ל: ${escape(womenService.label)}. הניקוד מבוסס על פעילות פרלמנטרית בכיוון השילוב.</p>` : '';
  const burdenSelections = [...(activeAnswer('burden') || []), ...(activeAnswer('burden-tasks') || [])];
  const serviceAnswered = SERVICE_CHOICES.some(choice => burdenSelections.includes(choice.id));
  const partnersAnswered = burdenSelections.some(id => ['seek-partners', 'self-reliance'].includes(id));
  const noArmyNote = questions.includes('no-army') ? '<p class="selection-note">מסלול ״בלי צבא״ הוא קטע הומוריסטי ואינו מקבל ניקוד מפלגתי.</p>' : '';
  const burdenNote = serviceAnswered || partnersAnswered ? `<p class="selection-note burden-score-note">${serviceAnswered ? 'ניקוד השירות מתייחס לגיוס חרדים ולשירות נשים, לפי הקבוצות שסימנת; בכל רכיב משקל נקודה אחת. ' : ''}${partnersAnswered ? 'בחירת השותפים משפיעה על מד ההמחשה בלבד, ללא ניקוד מפלגתי.' : ''}</p>` : '';
  if (!answered) return frame({ title: 'עוד אין לנו מספיק חומר.', body: `${dream}${womenServiceSummary}${noArmyNote}<p class="description">לא נענו שאלות עם ניקוד מפלגתי. נשאיר את האפשרויות פתוחות.</p><button class="primary" data-action="review-questions">בחזרה לשאלות <span aria-hidden="true">↻</span></button>${coalitionsButton()}${aboutLink()}<button class="text-button" data-action="restart">להתחיל מחדש</button>` });
  if (!scores.length) return frame({ title: 'לתשובה הזו אין ניקוד מפלגתי.', body: `${dream}${womenServiceSummary}${noArmyNote}${burdenNote}<p class="description">${partnersAnswered ? 'התשובות שלך נשמרו. לבחירת השותפים אין כרגע ניקוד מפלגתי.' : 'התשובה שלך נשמרה. לחלופה של ריכוז הדרישות בידי מערכת הביטחון לא ייחסנו עמדה של מפלגה או נקודות זכות.'} אפשר לחזור לשאלות האחרות כדי לקבל השוואה.</p><button class="primary" data-action="review-questions">בחזרה לשאלות</button>${coalitionsButton()}${aboutLink()}<button class="text-button" data-action="restart">להתחיל מחדש</button>` });
  const hasPositive = scores.some(party => party.points > 0);
  return frame({ title: hasPositive ? 'תוצאות ביניים' : 'עדיין לא נמצאה התאמה חיובית', body: `
    <p class="description">ענית על ${answered} מתוך ${scoredQuestions.length} דילמות. דילוגים לא נכללים בניקוד.${state.emergencyAnswer === 'central-request' ? ' לחלופה שבחרת בשאלת 7 באוקטובר אין ניקוד מפלגתי.' : ''}</p>
    ${dream}${womenServiceSummary}${noArmyNote}${burdenNote}
    ${hasPositive ? '' : '<p class="result-status">אף רשימה שנבדקה לא קיבלה ציון חיובי. פירוט הפערים או ציוני האפס מופיע בהמשך.</p>'}
    <p class="score-context">הרשימות מוצגות בשמותיהן ובאותיות הפתק הנוכחיות, לפי מיפוי ההיסטוריה המפלגתית. הניקוד מבוסס על התנהלות בעבר, עמדות מתועדות וחזון מוצהר. ההתאמות, ציוני האפס והמחלוקות מוצגים בנפרד. בתוך כל קבוצה מוצגות תחילה רשימות עם יותר מידע על התשובות שלך.</p>
    ${scoreGroupsView(scores, answered)}
    <details class="score-method"><summary>איך הניקוד עובד?</summary><p>בשאלת הגשר: משקל 2 לעמדה מתועדת ומשקל 1 להתנהלות מעורבת או להערכת אחריות קואליציונית. בנעים בסופ״ש: ציר של איסור, מצב קיים והרחבה. עמדה באותה קטגוריה מקבלת 2, קטגוריה סמוכה 0, והקצה ההפוך מינוס 2. בשאלת בוקר 7 באוקטובר, העדפת יוזמה מיידית מורידה נקודה אחת לליכוד כהערכת אחריות מיניסטריאלית להיערכות משרד התחבורה. בחלופה השנייה אין ניקוד; אין נקודת זכות לאף מפלגה או הערכה איך שר אחר היה פועל. בשאלות הייצוג וההפרדה בנושא נשים: משקל 1 לפי הייצוג בפועל או מעשה החקיקה שנבדק. בהפרדה באקדמיה הכיסוי הראשוני כולל רק את עוצמה יהודית והדמוקרטים; היעדר מקור לרשימה אחרת אינו עמדה נייטרלית. בשאלת המדרכות: נקודה אחת לדמוקרטים בכיוון ההתנגדות להכוונה מגדרית, לפי העתירה של פינק ורוזין, ומינוס נקודה לעוצמה יהודית כהערכת אחריות מיניסטריאלית של בן גביר לאכיפה. אין בכך קביעה שהורה לאפשר הפרדה; לחלופה התומכת בהפרדה אין נקודת זכות לעוצמה יהודית. בשאלת ההגנה על קטינות: שתי נקודות לביחד על פעילות מירב כהן. נקודה לישראל ביתנו, לדמוקרטים ולמשותפת על פעילות חקיקתית נגד נישואי קטינים; מינוס נקודה לש״ס וליהדות התורה על התנגדות פעילה לקידום החוק, באותו משקל של הפעילות לקידומו: העדויות בשני הכיוונים הן חקיקה כללית, ולא טיפול ביבנאל. לליכוד נקודת זכות לחקיקה ומינוס נקודה לכל אחד משני משרדים: חינוך בראשות יואב קיש ורווחה באחריות חיים כץ. לש״ס מופחתת גם נקודה על אחריות יעקב מרגי למשרד הרווחה עד יולי 2025. הסכומים בבחירה באכיפה: ${scoreTotalsText(scoreMinorsProtection('enforce'))}. לעוצמה יהודית מינוס נקודה על אחריות בן גביר לאכיפה. בחלופת מנהגי הקהילה מתהפכים רק ציוני הפעילות לקידום ההגנה; אין נקודות זכות על כשלי אכיפה או על התנגדות להגבלת נישואי קטינים. המקורות החקיקתיים הם עדות חלקית, ולא קביעה על עמדה בכל פרט בפרשה. שאלת החלום מוסיפה נקודת זיקה אחת לרשימות שעבורן נמצא חזון תואם. אין הפחתת נקודות לחלום האחר, ואין קביעה שרשימות שלא נבדקו אינן שותפות לאותו חלום. בשאלות הנטל, לגיוס חרדים ולשירות נשים משקל נקודה לכל רכיב. במאחזים, לעמדות הדמוקרטים והציונות הדתית משקל נקודה; להחלטת הקבינט בראשות נתניהו משקל שתי נקודות ולפעילות בן גביר לקידומה משקל נקודה. הסכומים בבחירה להגביל נקודות מבודדות: ${scoreTotalsText(scoreBurden(['limit-outposts']))}. בבחירת קבוצות השירות, הניקוד מתייחס להכללת חרדים ונשים ברשימת הקבוצות שסומנו או לאי־הכללתם. לשירות נשים משקל חלש לפי פעילות מיכאלי ושרון ניר לקידום השילוב וניסיון סמוטריץ׳ להסיר הגנה עליו; המקורות אינם מכסים כל פרט בחובת הגיוס. בחירה בתרחיש ללא צבא אינה מקבלת ניקוד מפלגתי. שירות גברים לא חרדים ובחירת שותפים משפיעים על המד בלבד. לשאלת שירות הנשים הנפרדת אותו ניקוד כמו לרכיב המקביל בשאלת הנטל, בלי לספור אותו פעמיים. שאלת חמאס והרשות נשענת על מעשים: משקל 2 להחלטת ממשלת נתניהו להכניס כסף קטארי ולפרישת ליברמן במחאה על המדיניות. לביחד מופחתת נקודה כהערכת אחריות להמשך המימון במנגנון מתוקן, ללא נקודת זכות בחלופה השנייה. קיזוז כספי הרשות בידי סמוטריץ׳ מובא כרקע בלבד ואינו מנוקד: הוא אינו מעיד כשלעצמו על תמיכה בחמאס או התנגדות להחלשתו. אין ניקוד על הבטחה או הבהרה. השיוך לכיוון המדיניות הוא פרשנות למעשים המתועדים. הקטגוריות והמשקלים הם פרשנות במודל.</p><p>אפס הוא ציון של מרחק בין החלופות במודל, לא קביעה שהמפלגה נייטרלית. דילוג או היעדר מקור אינם מוסיפים ציון כלל. ההשוואה בנעים בסופ״ש עוסקת בכיוון המדיניות, ולא בהסכמה נפרדת לכל פרט כמו תעריף או סוג רכבת. באיחוד רשימות מחושב ממוצע הציונים ההיסטוריים לכל שאלה, כדי לא להכפיל את משקלה. המקורות והשיוך ההיסטורי מפורטים תחת ״למה?״.</p></details>
    <details class="score-method"><summary>מי עדיין לא נכלל בהשוואה?</summary><p>לרשימות הבאות אין כרגע ניקוד לתשובות שלך; היעדר מידע אינו עמדה נייטרלית:</p><p>${unscoredCurrentLists(scores).map(([letters, name]) => `${escape(name)} (${escape(letters)})`).join(' · ')}</p><p>המיפוי נבדק ב־${MAPPING_CHECKED_ON}. רשימות שהודיעו על פרישה אינן נכללות בתוצאות.</p></details>
    <div class="actions">${coalitionsButton()}<button class="back" data-action="back">חזרה</button></div>${aboutLink()}<button class="text-button" data-action="review-questions">לעבור שוב על השאלות</button><button class="text-button" data-action="restart">להתחיל מחדש</button>` }, { stage: 'התוצאות שלך' });
}

function aboutLink() {
  if (state.authority) return '';
  return '<p class="selection-note about-link"><a href="about.html" target="_blank" rel="noopener noreferrer">על השאלון ובחירת השאלות<span class="sr-only"> (נפתח בלשונית חדשה)</span></a></p>';
}

function coalitionsButton() {
  return '<button class="primary coalition-next" data-action="coalitions">ועם מי הפתק הזה יושב? <span aria-hidden="true">←</span></button>';
}

function coalitionMatrixView(scores) {
  const parties = scores.length ? COALITION_PARTIES.filter(party => scores.some(score => score.letters === party.letters)) : COALITION_PARTIES;
  const number = value => new Intl.NumberFormat('he', { maximumSignificantDigits: 2 }).format(value);
  const label = party => `<abbr title="${escape(party.name)}" aria-label="${escape(party.name)}">${escape(party.letters)}</abbr>`;
  return `<figure class="coalition-matrix"><figcaption id="coalition-matrix-title">מטריצת השותפויות${scores.length ? '' : ' · לפני נרמול'}</figcaption>
    <div class="coalition-matrix-scroll" role="region" aria-labelledby="coalition-matrix-title" tabindex="0"><table>
      <caption class="sr-only">שורה: המפלגה שנבדקת. עמודה: המפלגה שהציון שלה משפיע עליה.</caption>
      <thead><tr><td></td>${parties.map(party => `<th scope="col">${label(party)}</th>`).join('')}</tr></thead>
      <tbody>${parties.map(party => {
        const links = parties.map(other => coalitionWeight(party.letters, other.letters));
        const divisor = scores.length ? links.reduce((sum, link) => sum + link.weight, 0) : 1;
        return `<tr><th scope="row">${label(party)}</th>${links.map((link, index) => {
          const value = link.weight / divisor;
          const blocked = !link.weight && link.basis.startsWith('סירוב');
          const kind = value > 0 ? 'positive' : blocked ? 'blocked' : 'unknown';
          const band = value >= 0.75 ? 4 : value >= 0.5 ? 3 : value >= 0.25 ? 2 : value >= 0.125 ? 1 : 0;
          const description = `${party.name} ← ${parties[index].name}: ${link.basis}; משקל ${value}`;
          return `<td class="matrix-${kind}" data-value="${value}" data-band="${band}" title="${escape(description)}" aria-label="${escape(description)}"><bdi>${number(value)}</bdi></td>`;
        }).join('')}</tr>`;
      }).join('')}</tbody></table></div>
    <p class="matrix-legend">ירוק כהה יותר = משקל גבוה יותר. אפס אדום: סירוב מתועד. אפס אפור: קשר שלא מופה. אלה אפסים מדויקים, לא עיגול.</p>
    <p class="matrix-legend">${scores.length ? 'כל שורה מסתכמת ל־1 לפני עיגול. מוצגות המפלגות שקיבלו ציון ישיר.' : 'כאן מוצגים משקלי הקשרים; אחרי מענה לשאלות מנרמלים את השורות לפי המפלגות שקיבלו ציון.'}</p>
    <p class="matrix-key">${parties.map(party => `<span><b>${escape(party.letters)}</b> ${escape(party.name)}</span>`).join('')}</p>
  </figure>`;
}

function coalitionScoreView() {
  const scores = state.authority ? [] : scoreCoalitions(currentScoreContext().scores);
  const positive = scores.filter(party => party.points > 0);
  const neutral = scores.filter(party => party.points === 0);
  const negative = scores.filter(party => party.points < 0);
  const number = value => new Intl.NumberFormat('he', { maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(value);
  const rows = parties => parties.map(party => `<li data-coalition-party="${escape(party.letters)}"><div class="coalition-score-heading"><strong>${escape(party.name)}</strong><bdi>${number(party.points)}</bdi></div></li>`).join('');
  const group = (parties, label, kind) => parties.length ? `<section class="coalition-score-group" data-coalition-group="${kind}"><h3>${label}</h3><ol class="coalition-ranking" aria-label="${label}">${rows(parties)}</ol></section>` : '';
  return `<p class="description">כדי להקים ממשלה, מפלגות חוברות לקואליציה. לכן הפתק שלך משפיע גם על השותפות שיצטרפו לממשלה.</p>
    <p class="coalition-question">אז איך מבינים איזו מפלגה תקדם קואליציה שמתאימה לך?</p>
    <p class="coalition-punchline">פשוט. מכפילים את וקטור הציונים שלך במטריצת השותפויות.</p>
    <p class="selection-note">כלומר, הציון של כל מפלגה מושפע גם מההתאמה שלך לשותפות האפשריות שלה.</p>
    ${coalitionMatrixView(scores)}
    ${positive.length ? group(positive, 'התאמה דרך שותפות', 'positive') : `<p class="result-status">${scores.length ? 'גם אחרי שקלול השותפות, לא נמצאה התאמה חיובית.' : 'צריך לענות על שאלות העמדות כדי לחשב התאמה דרך שותפות.'}</p>`}
    ${group(neutral, 'ללא יתרון בניקוד', 'neutral')}
    ${group(negative, 'פער דרך שותפות', 'negative')}
    <p class="selection-note">הערכה ראשונית לפי הקשרים שמופו; בלי מנדטים או הערכת סיכוי להקמת ממשלה.</p>
    ${scores.length ? '' : '<button class="primary" data-action="independent">בואו נבדוק לפי העמדות שלי</button>'}
    `;

}

function coalitionsView() {
  return frame({ title: 'ומי תקדם ממשלה שמתאימה לך?', body: `
    ${coalitionScoreView()}
    ${aboutLink()}
    <div class="actions"><button class="back" data-action="back">חזרה לתוצאות</button><button class="text-button" data-action="restart">להתחיל מחדש</button></div>` }, { stage: 'אחרי הפתק: הגושים', className: 'coalitions-screen' });
}

function independentView() {
  // TODO: Continue the topic flow with more dilemmas and sourced comparisons.
  const religionTransport = state.topics.includes('religion-transport');
  const title = religionTransport ? 'דת ותחבורה' : state.topics.includes('modesty-partnership') ? 'נשים' : 'השאלות לפי העמדות שלך';
  return frame({ title, body: `<p class="todo"><span class="todo-label">TODO</span> · ${religionTransport ? 'להוסיף את הדילמה הבאה ולבנות את המשך המסלול.' : 'לכתוב את השאלות ולבנות את המסלול.'}</p><button class="primary" data-action="topics">חזרה להתחלה <span aria-hidden="true">↻</span></button>` });
}

function render() {
  const views = { coalitions: coalitionsView, welcome: welcomeView, topics: topicsView, 'no-topics': noTopicsView, dream: dreamView, threat: threatView, draft: draftView, representation: representationView, academia: academiaView, sidewalk: sidewalkView, 'child-protection': minorsProtectionView, 'women-service': womenServiceView, burden: burdenView, 'burden-tasks': burdenTasksView, 'no-army': noArmyView, bridge: bridgeView, weekend: weekendView, emergency: emergencyView, 'bridge-result': bridgeResultView, party: partyView, 'fake-ballot': fakeBallotView, robot: robotView, 'robot-thanks': robotThanksView, sure: sureView, loading: loadingView, result: resultView, independent: independentView };
  app.innerHTML = views[state.step]();
  analytics.view(state.step);
  if (state.step === 'no-topics') timers.push(setTimeout(() => go(currentQuestions()[0], true), NO_TOPICS_DURATION));
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
    state.topics = input.checked ? [...state.topics.filter(id => id !== input.value), input.value] : state.topics.filter(id => id !== input.value);
  } else if (input.name === 'party') {
    state.party = BALLOT_CHOICES.find(party => party[0] === input.value);
    document.querySelector('[data-action="next"]').disabled = false;
    document.querySelector('#party-selection').textContent = `הפתק שבחרת: ${state.party[1]}${state.party[0] === BLANK_BALLOT[0] ? '' : ` (${state.party[0]})`}`;
    document.querySelector('#blank-ballot-note').hidden = state.party[0] !== BLANK_BALLOT[0];
  } else if (Object.values(QUESTIONS).some(question => question.inputName === input.name)) {
    const question = Object.values(QUESTIONS).find(question => question.inputName === input.name);
    if (['burden-answer', 'burden-tasks-answer'].includes(input.name)) {
      const previousValue = currentBurdenLevel().value;
      if (input.checked && input.dataset.burdenGroup !== 'service') app.querySelectorAll(`[name="${input.name}"]`).forEach(peer => {
        if (peer !== input && peer.dataset.burdenGroup === input.dataset.burdenGroup) peer.checked = false;
      });
      state[question.answerKey] = [...app.querySelectorAll(`[name="${input.name}"]:checked`)].map(item => item.value);
      if (input.name === 'burden-answer') {
        state.noArmy = false;
        state.noArmyAnswer = null;
        const { current, total } = progress(state.step, state);
        app.querySelector('.step-label').textContent = `שאלה ${current} מתוך ${total}`;
      }
      app.querySelector('#burden-impact').textContent = burdenImpact();
      updateBurdenMeter(previousValue);
    } else state[question.answerKey] = input.checked ? input.value : null;
    updateQuestionAction();
  }
  if (['authority', 'topic'].includes(input.name)) updateTopicSummary();
  if (['authority', 'topic', 'party', ...Object.values(QUESTIONS).map(question => question.inputName)].includes(input.name)) saveHistory();
});

app.addEventListener('click', event => {
  const input = event.target;
  const question = input.matches('input[type="radio"]') && Object.values(QUESTIONS).find(item => item.inputName === input.name);
  if (question && state[question.answerKey] === input.value) {
    input.checked = false;
    state[question.answerKey] = null;
    updateQuestionAction();
    saveHistory();
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') back();
  // The coalition map weighs the user's own position scores, so the recommendation route has nothing to propagate.
  else if (action === 'coalitions' && state.step === 'bridge-result') {
    go('coalitions');
  }
  else if (action === 'start') go('topics');
  else if (action === 'restart') restart();
  else if (action === 'independent') restart();
  else if (action === 'topics') restart('topics');
  else if (action === 'choose-service') go('burden');
  else if (state.step === 'no-army' && (action === 'no-army-faith' || action === 'no-army-unsure')) {
    state.noArmyAnswer = action === 'no-army-faith' ? 'faith' : 'unsure';
    advanceQuestion();
  }
  else if (action === 'review-questions') go(currentQuestions()[0]);
  else if (action === 'update-recommendation') {
    state.party = null;
    state.robot = null;
    state.cutscene = false;
    go('party');
  }
  else if (action === 'next') {
    if (state.step === 'topics') go(state.authority ? 'party' : !state.topics.length ? 'no-topics' : currentQuestions()[0] || 'independent');
    else if (state.step === 'party' && state.party) go(state.party[0] === FAKE_BALLOT[0] ? 'fake-ballot' : 'robot');
    else if (currentQuestions().includes(state.step)) {
      if (state.step === 'burden') {
        state.noArmy = !hasAnswer('burden');
        state.noArmyAnswer = null;
      }
      if (!hasAnswer(state.step)) {
        analytics.skip(state.step);
        state[QUESTIONS[state.step].answerKey] = null;
      }
      advanceQuestion();
    }
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
