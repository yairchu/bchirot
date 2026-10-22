import { PARTIES, PARTY_NOTICES } from './parties.js';

export const COALITIONS_CHECKED_ON = '2026-10-22';
const report = 'https://www.ynet.co.il/news/elections2026/article/sy6ekitsfx';
export const GOVERNMENT_EXPLAINER = 'https://www.ynet.co.il/news/elections2026/article/bjdwgoq2gg';
const coveredLetters = ['מחל', 'רק', 'דרך', 'אמת', 'ל', 'שס', 'ג', 'ב', 'ט', 'עם', 'ודם'];
export const COALITION_PARTIES = coveredLetters.flatMap(letters => {
  const party = PARTIES.find(party => party[0] === letters);
  return party && !PARTY_NOTICES[letters] ? [{ letters, name: party[1] }] : [];
});

// Relations describe evidence, not probabilities or a numerical compatibility score.
// A declaration about Netanyahu must not become a veto of every future Likud leader.
const opposition = ['רק', 'דרך', 'אמת', 'ל'];
export const COALITION_RELATIONS = [
  ...['רק', 'אמת', 'ל'].map(from => ({
    from, to: 'מחל', kind: 'veto', label: 'לא עם נתניהו', date: '2026-10-11',
    detail: 'הצהרת ראש הרשימה נגד ישיבה בממשלה עם נתניהו. אין כאן קביעה על הליכוד בהנהגה אחרת.', source: report,
  })),
  { from: 'דרך', to: 'מחל', kind: 'veto', label: 'נגד נתניהו כשר', date: '2026-10-11',
    detail: 'איזנקוט התנגד להצעת בנט שנתניהו יוכל להיות שר בממשלה עתידית. זו מגבלה על כהונת נתניהו, לא פסילה גורפת של כל חברי הליכוד.', source: report },
  ...opposition.flatMap(from => opposition.filter(to => to !== from).map(to => ({
    from, to, kind: 'coordination', label: 'תיאום בגוש', date: '2026-09-27',
    detail: 'ראשי הרשימות השתתפו בתיאום מהלכי הגוש ובהסכם אי־תקיפה. זהו שיתוף פעולה מתועד, לא הסכם קואליציוני או הבטחה לשבת יחד.', source: report,
  }))),
];
export function coalitionRelation(from, to) {
  if (!COALITION_PARTIES.some(party => party.letters === from) || !COALITION_PARTIES.some(party => party.letters === to)) return null;
  if (from === to) return null;
  return COALITION_RELATIONS.find(relation => relation.from === from && relation.to === to) || null;
}

// Historical components are named explicitly: today's merged ballots did not exist then.
const historicalGroups = [
  { letters: ['מחל', 'שס', 'ג', 'ב', 'ט'], date: '2022-12-29', government: 'הממשלה ה־37',
    detail: 'הליכוד, ש״ס, יהדות התורה, עוצמה יהודית והציונות הדתית היו בקואליציה שהוקמה בדצמבר 2022. לגבי הפתק ״הציונות הדתית וזהות״, העדות מתייחסת לציונות הדתית בלבד. זה אינו אישור לשותפות עתידית.',
    source: 'https://www.idi.org.il/articles/46842' },
  { letters: ['רק', 'אמת', 'ל', 'עם'], date: '2021-06-13', government: 'הממשלה ה־36',
    detail: 'יש עתיד וימינה בראשות בנט, העבודה ומרצ, ישראל ביתנו ורע״ם היו שותפות בקואליציית 2021. המיפוי לביחד ולדמוקרטים מתייחס לרכיבים ההיסטוריים שלהן, ולא לרשימות הנוכחיות בשלמותן. שותפות אז אינה התחייבות להיום.',
    source: 'https://m.knesset.gov.il/mk/government/pages/coalitionagreements.aspx' },
];
export function coalitionHistory(from, to) {
  if (from === to) return [];
  return historicalGroups.filter(group => group.letters.includes(from) && group.letters.includes(to));
}
