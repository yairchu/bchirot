export const CUTSCENE_DURATION = 1000;
export const MOBILE_CONFIRM_DELAY = 700;
export const EASTER_EGG_DURATION = 7000;

export const TOPIC_CHOICES = [
  { id: 'religion-transport', label: 'דת ותחבורה' },
  { id: 'todo-2', label: 'TODO' },
];

export function afterRobot(answer) {
  if (answer === 'yes') return 'robot-thanks';
  return 'sure';
}

export function progress(step) {
  if (step === 'bridge') return { current: 2, total: 2 };
  const total = 4;
  const current = { topics: 1, party: 2, robot: 3, sure: 4 }[step];
  return { current, total: step === 'topics' ? null : total };
}
