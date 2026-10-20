export const CUTSCENE_DURATION = 1000;

export const TOPIC_CHOICES = [
  { id: 'religion-transport', label: 'דת ותחבורה' },
  { id: 'todo-2', label: 'TODO' },
];

export function afterRobot(answer, mouseAvailable) {
  if (answer === 'yes') return 'robot-thanks';
  return mouseAvailable ? 'sure' : 'loading';
}

export function progress(step, mouseAvailable) {
  if (step === 'bridge') return { current: 2, total: 2 };
  const total = mouseAvailable ? 4 : 3;
  const current = { topics: 1, party: 2, robot: 3, sure: 4 }[step];
  return { current, total: step === 'topics' ? null : total };
}
