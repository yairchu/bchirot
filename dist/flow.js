export const CUTSCENE_DURATION = 1000;

export function afterRobot(answer, mouseAvailable) {
  return answer === 'no' && mouseAvailable ? 'sure' : 'loading';
}

export function progress(step, mouseAvailable) {
  const total = mouseAvailable ? 4 : 3;
  const current = { topics: 1, party: 2, robot: 3, sure: 4 }[step];
  return { current, total: step === 'topics' ? null : total };
}
