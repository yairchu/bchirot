export const TOPICS = [
  { id: 'cost', icon: '₪', title: 'לסגור את החודש', detail: 'יוקר המחיה, דיור וכלכלה' },
  { id: 'security', icon: '◈', title: 'לחיות בביטחון', detail: 'ביטחון, מדיניות חוץ והסדרים' },
  { id: 'democracy', icon: '⚖', title: 'כללי המשחק', detail: 'דמוקרטיה, משפט ומינהל תקין' },
  { id: 'community', icon: '☀', title: 'החיים המשותפים', detail: 'דת ומדינה, שוויון וזכויות' },
  { id: 'services', icon: '✚', title: 'מה שמגיע לכולנו', detail: 'חינוך, בריאות ורווחה' },
  { id: 'future', icon: '↗', title: 'לחשוב קדימה', detail: 'סביבה, תחבורה והדור הבא' },
];

export function toggleTopic(selected, id) {
  if (!TOPICS.some(topic => topic.id === id)) return selected;
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
}

export function afterRobot(answer, mouseAvailable) {
  return answer === 'no' && mouseAvailable ? 'sure' : 'loading';
}

export function progress(step, mouseAvailable) {
  const total = mouseAvailable ? 4 : 3;
  const current = { topics: 1, party: 2, robot: 3, sure: 4 }[step];
  return { current, total: step === 'topics' ? null : total };
}
