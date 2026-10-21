export const CUTSCENE_DURATION = 1000;
export const MOBILE_CONFIRM_DELAY = 700;
export const EASTER_EGG_DURATION = 7000;
export const NO_TOPICS_DURATION = 1800;

export const TOPIC_CHOICES = [
  { id: 'religion-transport', label: 'דת ותחבורה' },
  { id: 'war-dream', label: 'מלחמה וחלום' },
  { id: 'todo-2', label: 'TODO' },
];

// Ordering, shared membership, answer keys and progress use one question catalog.
export const QUESTIONS = {
  dream: { topics: ['war-dream'], answerKey: 'dreamAnswer', inputName: 'dream-answer', scored: true },
  bridge: { topics: ['religion-transport'], answerKey: 'bridgeAnswer', inputName: 'bridge-answer', scored: true },
  weekend: { topics: ['religion-transport'], answerKey: 'weekendAnswer', inputName: 'weekend-answer', scored: true },
  emergency: { topics: ['religion-transport', 'war-dream'], answerKey: 'emergencyAnswer', inputName: 'emergency-answer', scored: true },
};

export function questionRoute(topics) {
  return Object.keys(QUESTIONS).filter(id => QUESTIONS[id].topics.some(topic => topics.includes(topic)));
}

export function questionnaireQuestions(topics = []) {
  // Continuing without topics keeps the existing invitation to try transport.
  return questionRoute(topics.length ? topics : ['religion-transport']);
}

export function additionalQuestionCount(topic, selected = []) {
  const index = selected.indexOf(topic);
  // Selected topics retain their contribution in selection order. An unchecked
  // topic shows what it would add now. The selected contributions sum to the route.
  const preceding = index < 0 ? selected : selected.slice(0, index);
  return questionRoute([...preceding, topic]).length - questionRoute(preceding).length;
}

export function afterRobot(answer) {
  if (answer === 'yes') return 'robot-thanks';
  return 'sure';
}

export function progress(step, { topics = [], authority = false } = {}) {
  const questions = questionnaireQuestions(topics);
  const index = questions.indexOf(step);
  if (index >= 0) return { current: index + 2, total: questions.length + 1 };
  if (step === 'topics') return { current: 1, total: authority ? 4 : topics.length && questions.length ? questions.length + 1 : null };
  const total = 4;
  const current = { topics: 1, party: 2, robot: 3, sure: 4 }[step];
  return { current, total: step === 'topics' ? null : total };
}
