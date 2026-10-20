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
};

export function scoreBridge(answer) {
  if (!['shabbat', 'weekdays'].includes(answer)) return [];
  const direction = answer === 'shabbat' ? 1 : -1;
  return BRIDGE_POSITIONS.map(party => ({ ...party, points: direction * party.position }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'he'));
}
