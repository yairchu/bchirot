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
  { id: 'yesh-atid', name: 'יש עתיד', position: 2, basis: 'direct', reason: 'יאיר לפיד התנגד להקפאת העבודות בעקבות דרישת המפלגות החרדיות.', source: harediSource },
  { id: 'labor', name: 'העבודה / המחנה הציוני', position: 2, basis: 'direct', reason: 'אבי גבאי וציפי לבני ביקרו את ההקפאה ואת הפגיעה בציבור הנהגים.', source: oppositionSource },
  { id: 'meretz', name: 'מרצ', position: 2, basis: 'direct', reason: 'מרצ דרשה להעדיף את צורכי התחבורה ויזמה דיון בכנסת נגד ההקפאה.', source: oppositionSource },
  { id: 'yisrael-beitenu', name: 'ישראל ביתנו', position: 2, basis: 'direct', reason: 'בינואר 2019 ליברמן הגן על העבודות החיוניות בגשר בשבת והתנגד לניסיונות לאסור אותן.', source: 'https://www.kore.co.il/viewArticle/48258' },
];

export const BASIS_LABELS = {
  direct: 'עמדה מתועדת',
  mixed: 'התנהלות מעורבת',
  coalition: 'הערכת אחריות קואליציונית',
  responsibility: 'הערכת אחריות מיניסטריאלית — משקל 1',
};

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
const transportPlatformSource = 'https://www.ynet.co.il/articles/0,7340,L-5490792,00.html';
export const WEEKEND_POSITIONS = [
  { id: 'shas', name: 'ש״ס', position: 0, basis: 'direct', reason: 'חברי כנסת מש״ס הציעו להרחיב את הסמכות לאסור תחבורה בשבת. המודל מסווג זאת לכיוון איסור; ההצעה אינה חוק שהתקבל.', source: 'https://www.zman.co.il/366642/' },
  { id: 'utj', name: 'יהדות התורה', position: 0, basis: 'direct', reason: 'במענה לשאלון ב־2019 המפלגה הודיעה שתיאבק ביוזמות תחבורה ציבורית בשבת.', source: transportPlatformSource },
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
  if (!['continue', 'on-demand'].includes(answer)) return [];
  return [{
    id: 'likud', name: 'הליכוד', points: answer === 'on-demand' ? 1 : -1, basis: 'responsibility',
    reason: 'משרד התחבורה בראשות מירי רגב מהליכוד הפסיק בנובמבר 2023 את מתכונת החירום בשבת, לאחר בדיקת הביקוש והצורך הביטחוני, והתחייב לחידושה לפי צורך חיוני. בג״ץ לא מצא עילה להתערבות. השיוך לליכוד הוא הערכת אחריות לשרת התחבורה, ולא קביעה על מניע דתי או על התנהלות מפלגות אחרות.',
    source: 'https://www.gov.il/BlobFolder/news/news-28-11/he/23082230.Y05.pdf',
    followupSource: 'https://img.haarets.co.il/bs/0000018c-11c0-d65f-a7dd-f1d7cc590000/2d/a3/1d17d3c7472693b9e5df0db8a30f/transportation.pdf',
    followupLabel: 'עותק נוסף של פסק הדין',
  }];
}

export function scoreReligion(bridgeAnswer, weekendAnswer, emergencyAnswer = null) {
  const totals = new Map();
  for (const [question, scores] of [['גשר יהודית', scoreBridge(bridgeAnswer)], ['נעים בסופ״ש', scoreWeekend(weekendAnswer)], ['תחבורה בזמן מלחמה', scoreEmergency(emergencyAnswer)]]) {
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
