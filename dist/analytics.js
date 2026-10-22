import { QUESTIONS } from './flow.js';

// Only fixed event names leave this module: never pass questionnaire state,
// chosen answers, topic selections, ballot letters or result scores to Plausible.
export function createQuizAnalytics(browser) {
  let sent = new Set();
  const sendOnce = name => {
    if (sent.has(name)) return;
    sent.add(name);
    try {
      browser.plausible?.(name);
    } catch {
      // Analytics must never interrupt the questionnaire.
    }
  };
  const questionEvent = (event, step) => {
    if (QUESTIONS[step]?.scored) sendOnce(`${event}: ${step}`);
  };
  return {
    reset() { sent = new Set(); },
    view(step) {
      if (step === 'topics') sendOnce('Quiz Started');
      questionEvent('Question Viewed', step);
      if (['result', 'bridge-result'].includes(step)) sendOnce('Quiz Completed');
    },
    skip(step) { questionEvent('Question Skipped', step); },
  };
}
