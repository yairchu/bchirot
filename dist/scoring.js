// These are historical parties in the 2018–2019 case, not current ballot lists.
// Positive positions favor Saturday work. Negative positions favor avoiding it.
// Weight 2: a documented position; weight 1: mixed conduct or coalition responsibility.
// Coalition responsibility is an editorial inference, not a claimed direct statement.
// See ../docs/bridge-scoring.md for the model and sources.
const oppositionSource = 'https://www.walla.co.il/news/politics/3182633';
const harediSource = 'https://www.walla.co.il/news/politics/3182604';
const coalitionSource = 'https://www.idi.org.il/articles/3412';

export const BRIDGE_POSITIONS = [
  { id: 'shas', name: 'ש״ס', position: -2, basis: 'direct', reason: 'נציגי ש״ס דרשו למנוע את עבודות השבת.', source: harediSource },
  { id: 'utj', name: 'יהדות התורה', position: -2, basis: 'direct', reason: 'ראשי יהדות התורה פעלו נגד ביצוע עבודות הגשר בשבת.', source: harediSource },
  { id: 'likud', name: 'הליכוד', position: -1, basis: 'mixed', reason: 'שר התחבורה ישראל כץ הקפיא את העבודות בעקבות המחאה; בהמשך המדינה אפשרה את חידושן בשבתות.', source: oppositionSource, followupSource: 'https://www.mako.co.il/news-israel/local-q1_2019/Article-83d23b914067861004.htm' },
  { id: 'kulanu', name: 'כולנו', position: -1, basis: 'coalition', reason: 'משקל חלש של אחריות קואליציונית לממשלה שהקפיאה את העבודות. זו הערכת המודל, ללא עמדה ישירה שאותרה בפרשה.', source: coalitionSource },
  { id: 'jewish-home', name: 'הבית היהודי', position: -1, basis: 'coalition', reason: 'הבית היהודי בראשות בנט הייתה בקואליציה בזמן ההקפאה ב־2018. הציון משקף אחריות קואליציונית חלשה, ללא עמדה ישירה שאותרה בפרשה.', source: coalitionSource },
  { id: 'tkuma', name: 'האיחוד הלאומי–תקומה', position: -1, basis: 'coalition', reason: 'תקומה, בראשות אורי אריאל ועם בצלאל סמוטריץ׳, הייתה רכיב בסיעת הבית היהודי בזמן ההקפאה ב־2018, ואריאל כיהן כשר החקלאות בממשלה. הציון משקף את אותה אחריות קואליציונית חלשה שניתנה לבית היהודי, ללא עמדה ישירה שאותרה בפרשה.', source: 'https://en.wikipedia.org/wiki/Uri_Ariel', followupSource: coalitionSource, followupLabel: 'הרכב הממשלה' },
  { id: 'yesh-atid', name: 'יש עתיד', position: 2, basis: 'direct', reason: 'יאיר לפיד התנגד להקפאת העבודות בעקבות דרישת המפלגות החרדיות.', source: harediSource },
  { id: 'labor', name: 'העבודה / המחנה הציוני', position: 2, basis: 'direct', reason: 'אבי גבאי וציפי לבני ביקרו את ההקפאה ואת הפגיעה בציבור הנהגים.', source: oppositionSource },
  { id: 'meretz', name: 'מרצ', position: 2, basis: 'direct', reason: 'מרצ דרשה להעדיף את צורכי התחבורה ויזמה דיון בכנסת נגד ההקפאה.', source: oppositionSource },
  { id: 'yisrael-beitenu', name: 'ישראל ביתנו', position: 2, basis: 'direct', reason: 'בינואר 2019 ליברמן הגן על העבודות החיוניות בגשר בשבת והתנגד לניסיונות לאסור אותן.', source: 'https://www.kore.co.il/viewArticle/48258' },
];

// Labels name the kind of evidence; the weight shown comes from the points
// actually given, so a label can never disagree with its score.
export const BASIS_LABELS = {
  direct: 'עמדה מתועדת',
  mixed: 'התנהלות מעורבת',
  coalition: 'הערכת אחריות קואליציונית',
  responsibility: 'הערכת אחריות מיניסטריאלית',
  vision: 'זיקה לחזון מוצהר',
  policy: 'עמדה מתועדת',
  action: 'החלטה שבוצעה',
  composition: 'הרכב הרשימה שהוגשה',
  'legislative-opposition': 'התנגדות פעילה להרחבת ההגנה בחקיקה',
  'sustained-action': 'פעילות מתמשכת בנושא',
  'partial-action': 'מעשה מתועד ברכיב אחד של הדילמה',
  interpretation: 'פרשנות לסדר עדיפויות מוצהר',
};

export function basisLabel(evidence) {
  const label = BASIS_LABELS[evidence.basis];
  return evidence.points ? `${label} — משקל ${Math.abs(evidence.points)}` : label;
}

export function scoreBridge(answer) {
  if (!['shabbat', 'weekdays'].includes(answer)) return [];
  const direction = answer === 'shabbat' ? 1 : -1;
  return BRIDGE_POSITIONS.map(party => ({ ...party, points: direction * party.position }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'he'));
}

// A separate policy axis: ban = 0, keep today's municipal arrangement = 1,
// expand regulated Saturday transit = 2. Distance gives +2 / 0 / -2.
// These are editorial policy categories, not claims that every detail (fares,
// rail, local routing) was individually endorsed. Unresearched parties are omitted.
// Keeping the status quo by an executed decision is a position too, not inaction.
const transportPlatformSource = 'https://www.ynet.co.il/articles/0,7340,L-5490792,00.html';
export const WEEKEND_POSITIONS = [
  { id: 'shas', name: 'ש״ס', position: 0, basis: 'direct', reason: 'חברי כנסת מש״ס הציעו להרחיב את הסמכות לאסור תחבורה בשבת. המודל מסווג זאת לכיוון איסור; ההצעה אינה חוק שהתקבל.', source: 'https://www.zman.co.il/366642/' },
  { id: 'utj', name: 'יהדות התורה', position: 0, basis: 'direct', reason: 'במענה לשאלון ב־2019 המפלגה הודיעה שתיאבק ביוזמות תחבורה ציבורית בשבת.', source: transportPlatformSource },
  { id: 'likud', name: 'הליכוד', position: 1, basis: 'action', reason: 'באוגוסט 2023, בהשקת הקו האדום של הרכבת הקלה, שרת התחבורה מירי רגב קבעה שהקו יפעל עד כניסת השבת ומצאתה, וכי המדינה פועלת לפי החוק והסטטוס קוו. זו החלטה לשמור על המצב הקיים; היא אינה איסור על ההסעות העירוניות.', source: 'https://www.mako.co.il/news-money/2023_q3/Article-8f407146fecf981027.htm' },
  { id: 'kulanu', name: 'כולנו', position: 2, basis: 'direct', reason: 'ב־2019 כולנו תמכה בהעברת הסמכות לתחבורה ציבורית בשבת לרשויות המקומיות. זו הרחבת האפשרות להפעיל שירות לפי החלטת הרשות, ולא התחייבות לרכבות או לכל פרט בחלופה.', source: transportPlatformSource },
  { id: 'yesh-atid', name: 'יש עתיד', position: 2, basis: 'direct', reason: 'בתשובת כחול לבן ב־2019, שבה הייתה יש עתיד רכיב, הוצע לאפשר לרשויות מקומיות להפעיל תחבורה בשבת לפי הצורך. העדות משויכת לרכיב יש עתיד בלבד; אין בה התחייבות לרכבות או לכל פרט בחלופה.', source: transportPlatformSource, followupSource: 'https://www.ynet.co.il/articles/0,7340,L-5490470,00.html', followupLabel: 'תשובת כחול לבן המלאה' },
  { id: 'otzma-yehudit', name: 'עוצמה יהודית', position: 0, basis: 'direct', reason: 'ב־2019 עוצמה יהודית התנגדה במפורש לתחבורה ציבורית בשבת במרחב הציבורי. זו עמדה לכיוון איסור, ולא טענה שאיסור על המערך העירוני כבר התקבל.', source: transportPlatformSource },
  { id: 'hadash', name: 'חד״ש', position: 2, basis: 'direct', reason: 'ב־2019 חד״ש תמכה בתחבורה ציבורית בסיסית בשבת לפי הצרכים והביקוש. זו עמדה לכיוון הרחבת השירות, ולא התחייבות נפרדת לכל פרט בחלופה.', source: transportPlatformSource },
  { id: 'balad', name: 'בל״ד', position: 2, basis: 'direct', reason: 'ב־2019 בל״ד תמכה בתחבורה ציבורית בשבת תוך התחשבות בקהילות דתיות מקומיות. זו עמדה לכיוון הרחבת השירות, ולא התחייבות נפרדת לכל פרט בחלופה.', source: transportPlatformSource },
  { id: 'labor', name: 'העבודה / המחנה הציוני', position: 2, basis: 'direct', reason: 'ב־2019 העבודה התחייבה לתחבורה ציבורית בשבת, לרבות רכבת, במתכונת מצומצמת ומוסדרת.', source: transportPlatformSource },
  { id: 'meretz', name: 'מרצ', position: 2, basis: 'direct', reason: 'ב־2019 מרצ תמכה בתחבורה ציבורית בכל ימות השבוע. הניקוד מתייחס להרחבת השירות, ולא להתחייבות נפרדת לכל פרט בחלופה.', source: transportPlatformSource },
  { id: 'yisrael-beitenu', name: 'ישראל ביתנו', position: 2, basis: 'direct', reason: 'ב־2019 ליברמן הציב תחבורה ציבורית בשבת בין דרישותיו לממשלה. המודל מסווג זאת לכיוון הרחבה, בלי להסיק הסכמה לכל פרט בחלופה.', source: 'https://shiftshatil.org.il/publictransport/' },
];

export function scoreWeekend(answer) {
  const positions = { ban: 0, keep: 1, expand: 2 };
  if (!Object.prototype.hasOwnProperty.call(positions, answer)) return [];
  return WEEKEND_POSITIONS.map(party => ({ ...party, points: 2 - 2 * Math.abs(positions[answer] - party.position) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'he'));
}

export function scoreEmergency(answer) {
  if (answer !== 'immediate') return [];
  return [{
    id: 'likud', name: 'הליכוד', points: -1, basis: 'responsibility',
    reason: 'לפי תחקיר וואלה, לא תוכנן מערך תחבורה ציבורית לשבת במקרה של מלחמה, והגעת חיילים ב־7 באוקטובר התעכבה בשל בעיות תחבורה. מינוס נקודה לליכוד משקף הערכה עריכתית של אחריות משרד התחבורה בראשות מירי רגב להיערכות וליוזמה. אין כאן קביעה שהשרה אסרה נסיעות בשבת או מה שר אחר היה עושה.',
    source: 'https://cars.walla.co.il/item/3622762',
    followupSource: 'https://img.haarets.co.il/bs/0000018c-11c0-d65f-a7dd-f1d7cc590000/2d/a3/1d17d3c7472693b9e5df0db8a30f/transportation.pdf',
    followupLabel: 'תיאור תגובת המדינה בפסק הדין',
  }];
}

export function scoreReligion(bridgeAnswer, weekendAnswer, emergencyAnswer = null) {
  const totals = new Map();
  for (const [question, scores] of [['גשר יהודית', scoreBridge(bridgeAnswer)], ['נעים בסופ״ש', scoreWeekend(weekendAnswer)], ['תחבורה בבוקר 7 באוקטובר', scoreEmergency(emergencyAnswer)]]) {
    for (const party of scores) {
      if (!totals.has(party.id)) totals.set(party.id, { id: party.id, name: party.name, points: 0, contributions: [] });
      const total = totals.get(party.id);
      total.points += party.points;
      total.contributions.push({ ...party, question });
    }
  }
  // Do not rank incomplete evidence above complete evidence just because a
  // missing contribution happens to avoid a negative score.
  return [...totals.values()].sort((a, b) => b.contributions.length - a.contributions.length || b.points - a.points || a.name.localeCompare(b.name, 'he'));
}
