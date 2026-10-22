import { PARTIES, PARTY_NOTICES } from './parties.js';

export const COALITIONS_CHECKED_ON = '2026-10-22';
const report = 'https://www.ynet.co.il/news/elections2026/article/sy6ekitsfx';
export const GOVERNMENT_EXPLAINER = 'https://www.ynet.co.il/news/elections2026/article/bjdwgoq2gg';
const coveredLetters = ['מחל', 'רק', 'דרך', 'אמת', 'ל', 'שס', 'ג', 'ב', 'ט', 'עם', 'ודם'];
export const COALITION_PARTIES = coveredLetters.flatMap(letters => {
  const party = PARTIES.find(party => party[0] === letters);
  return party && !PARTY_NOTICES[letters] ? [{ letters, name: party[1] }] : [];
});

// Relations retain the evidence; separate model weights below are not probabilities.
// A declaration about Netanyahu must not become a veto of every future Likud leader.
const opposition = ['רק', 'דרך', 'אמת', 'ל'];
export const COALITION_RELATIONS = [
  ...['עם', 'ודם'].map(to => ({
    from: 'ט', to, kind: 'veto', label: 'סירוב של סמוטריץ׳ לשותפות עם מפלגות ערביות', date: '2026-02-12',
    detail: to === 'עם'
      ? 'סמוטריץ׳ התגאה בכך שמנע ממשלה עם רע״ם. הסירוב כולל גם הסתמכות על תמיכה מבחוץ או הימנעות. המיפוי מתייחס להנהגת סמוטריץ׳ ברשימה הנוכחית, לא להצהרה נפרדת של זהות.'
      : 'פסילת השותפות עם המפלגות הערביות מוחלת במודל גם על הרשימה המשותפת. המקור מתאר במפורש את חסימת רע״ם; ההחלה על המשותפת היא שיוך של הקו העקרוני במודל, בהנהגת סמוטריץ׳.',
    source: 'https://www.inn.co.il/news/689844',
  })),
  ...['עם', 'ודם', 'שס', 'ג'].map(to => ({
    from: 'ל', to, kind: 'veto', label: 'סירוב מפורש של ליברמן', date: '2026-10-15',
    detail: 'ליברמן שלל קואליציה עם רע״ם, המשותפת, ש״ס ויהדות התורה, וכן תמיכה בממשלת מיעוט. ההצהרה המאוחרת גוברת במודל על שותפות היסטורית.',
    source: 'https://www.mako.co.il/news-israel-elections/2026/Article-5b0d6cc444f31a1026.htm',
  })),
  ...['עם', 'ודם'].map(to => ({
    from: 'רק', to, kind: 'veto', label: 'סירוב מוצהר של בנט', date: '2026-02-02',
    detail: 'בנט הצהיר שלא יקים ממשלה הנשענת על מפלגות ערביות. זו הצהרתו מלפני איחוד הרשימות, ולא הצהרה משותפת של כל רכיבי ביחד; החסימה במודל מניחה שהוא עומד בראש הממשלה המוצעת.',
    source: 'https://www.mako.co.il/news-israel-elections/2026_q1/Article-75a42e70dcf1c91026.htm',
  })),
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

// Negotiations are weaker historical evidence than coalition membership.
// The account is attributed to Abbas; Likud disputed the purpose of the talks.
export const COALITION_NEGOTIATIONS = [{
  letters: ['מחל', 'עם'], date: '2021', reportedOn: '2022-09-02',
  detail: 'עבאס תיאר מו״מ עם הליכוד והצעות להסכם קואליציוני ב־2021, כולל פגישות עם נתניהו. הליכוד טען שהמגעים נועדו לבחירה ישירה. אין כאן קביעה שהוקמה קואליציה או שקיימת הסכמה עדכנית.',
  source: 'https://www.ynet.co.il/news/article/rkez4110ks',
}];

// Explicit modeling assumptions, not estimated probabilities. Unknown links carry
// no weight. A veto in either direction blocks the link under today's leadership.
export function coalitionWeight(from, to) {
  if (from === to) return { weight: 1, basis: 'המפלגה עצמה', sources: [] };
  const relations = [coalitionRelation(from, to), coalitionRelation(to, from)].filter(Boolean);
  if (relations.some(item => item.kind === 'veto')) return { weight: 0, basis: 'סירוב מתועד בהרכב ההנהגה הנוכחי', sources: relations.filter(item => item.kind === 'veto').map(item => item.source) };
  const coordination = relations.filter(item => item.kind === 'coordination');
  const history = coalitionHistory(from, to);
  if (coordination.length) return { weight: 0.5, basis: 'תיאום בגוש', sources: [...new Set(coordination.map(item => item.source))] };
  if (history.length) return { weight: 0.25, basis: 'שותפות בעבר', sources: [...new Set(history.map(item => item.source))] };
  const negotiations = COALITION_NEGOTIATIONS.filter(item => item.letters.includes(from) && item.letters.includes(to));
  if (negotiations.length) return { weight: 0.125, basis: 'מגעים בעבר — לפי עדות עבאס; ללא קואליציה', sources: negotiations.map(item => item.source) };
  return { weight: 0, basis: 'טרם מופה', sources: [] };
}

// Row-normalized matrix-vector multiplication, restricted to observed scores.
// A missing party score is never inserted as zero. Negative scores propagate too.
export function scoreCoalitions(scores) {
  const observed = new Map(scores.filter(item => Number.isFinite(item.points)).map(item => [item.letters, item]));
  return COALITION_PARTIES.filter(party => observed.has(party.letters)).map(party => {
    const terms = COALITION_PARTIES.filter(other => observed.has(other.letters)).flatMap(other => {
      const link = coalitionWeight(party.letters, other.letters);
      return link.weight ? [{ ...other, ...link, points: observed.get(other.letters).points }] : [];
    });
    const totalWeight = terms.reduce((sum, term) => sum + term.weight, 0);
    const points = terms.reduce((sum, term) => sum + term.weight * term.points, 0) / totalWeight;
    return { ...party, points, directPoints: observed.get(party.letters).points, terms };
  }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'he'));
}
