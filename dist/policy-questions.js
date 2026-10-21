import { PARTIES, PARTY_NOTICES } from './parties.js';

const draftSource = 'https://www.mako.co.il/news-israel-elections/2026/Article-4a2f820efe911a1027.htm';
const farmsSource = 'https://zionutdatit.org.il/hityashvut/farms/';
const democratsSource = 'https://democrats.org.il/content/annexation-jewish-majority';
const smotrichSource = 'https://www.mako.co.il/news-money/2023_q4/Article-cd46c87faebbc81027.htm';

export const BURDEN_GROUPS = [
  { id: 'draft', title: 'גיוס חרדים', options: [
    { id: 'draft', label: 'להחיל חובת שירות גם על חרדים', detail: 'גם למי שמבקש ללמוד בישיבה; קדימות לצורכי צה״ל, ושירות אזרחי למי שאינו נדרש לצבא.' },
    { id: 'exempt', label: 'לשמר פטור לתלמידי ישיבות', detail: 'להגן על המשך לימוד התורה גם במחיר מעגל משרתים מצומצם יותר.' },
  ] },
  { id: 'outposts', title: 'הגנה על מאחזים מבודדים', options: [
    { id: 'limit-outposts', label: 'להגביל מאחזים וחוות מבודדים', detail: 'לצמצם משימות הגנה ומוקדי חיכוך, גם במחיר צמצום ההתיישבות.' },
    { id: 'protect-outposts', label: 'לאפשר את ההתיישבות ולספק לה הגנה', detail: 'להעדיף אחיזה בשטח, גם כשהיא דורשת משאבי הגנה.' },
  ] },
];

export const BURDEN_TIMELINE = [
  { text: 'המפלגות חלוקות בשאלת השירות: יש הדורשות חובת שירות רחבה, ויש המבקשות להגן על הפטור ללומדי תורה. קיימות גם עמדות ביניים שלא הושוו כאן אוטומטית לפטור או לחובה גורפת.', url: draftSource, source: 'עמדות המפלגות בגיוס, N12, ‏8.10.2026' },
  { text: 'הדמוקרטים מציגים את צמצום המאחזים והחוות המבודדים כדרך להפחית את משימות ההגנה ואת עומס המילואים. זהו טיעון המפלגה, ולא חישוב של מספר ימי מילואים שייחסכו.', url: democratsSource, source: 'עמדת הדמוקרטים' },
  { text: 'הציונות הדתית מציגה את החוות כאמצעי לאחיזה במרחב ומתארת מעטפת ביטחון ותיאום עם הגורמים הממונים. השאלה בוחנת את העדיפות בין האחיזה בשטח למשאבי ההגנה הנדרשים.', url: farmsSource, source: 'עמדת הציונות הדתית' },
];

export const THREAT_DILEMMA = {
  title: 'חמאס והרשות — מה צריך להנחות אותנו?',
  note: 'זו בחירה בסדר עדיפויות. אפשר להתנגד גם לחמאס וגם למדינה פלסטינית, ואפשר לדלג אם החלופות לא מייצגות אותך.',
  context: 'סמוטריץ׳ תיאר ב־2015 את חמאס כנכס ואת הרשות כנטל בזירה הבינלאומית. ב־2023 הבהיר שהתכוון למאבק המדיני, ולא לתמיכה בחמאס. איזו עדיפות קרובה יותר לעמדתך?',
  options: [
    { id: 'hamas', label: 'לתעדף את המאבק בחמאס ולהבחין בינו לבין הרשות', detail: 'לבלום את הטרור והכוח הצבאי של חמאס, ולבחון תיאום והסדרים עם הרשות בהתאם לאינטרס הביטחוני.' },
    { id: 'pa', label: 'לתעדף מניעת מדינה פלסטינית, גם מול דרישות הרשות', detail: 'לראות גם בפעילות המדינית הבינלאומית של הרשות איום אסטרטגי, ולא להסתפק במאבק הצבאי בחמאס.' },
  ],
  timeline: [
    { text: 'האמירה מ־2015 התייחסה למאבק בזירה הבינלאומית ולהכרה ברשות לעומת חמאס. בראיון מ־30.12.2023 סמוטריץ׳ חזר על ההבחנה והכחיש שצידד בסיוע לחמאס.', url: smotrichSource, source: 'הראיון המלא ב־N12' },
    { text: 'הדמוקרטים מציעים מאבק בכוח הצבאי של חמאס לצד יוזמה מדינית והיפרדות. זו זיקה לגישה המבחינה בין המאבק בחמאס להסדר מדיני, ולא דירוג של מספרי קורבנות.', url: 'https://democrats.org.il/wp-content/uploads/2026/04/vision0426.pdf', source: 'מסמך החזון של הדמוקרטים' },
    { text: 'בתיעוד מ־2015 סמוטריץ׳ מסביר כי חמאס הוא ארגון טרור שלא יקבל את ההכרה הבינלאומית שהרשות עשויה לקבל.', url: 'https://www.inn.co.il/news/635746', source: 'הציטוט מ־2015 בהקשרו' },
  ],
};

const DRAFT_POSITIONS = [
  { id: 'democrats', letters: 'אמת', supports: 'draft' },
  { id: 'beyachad', letters: 'רק', supports: 'draft' },
  { id: 'yisrael-beitenu', letters: 'ל', supports: 'draft' },
  { id: 'yashar', letters: 'דרך', supports: 'draft' },
  { id: 'shas', letters: 'שס', supports: 'exempt' },
  { id: 'utj', letters: 'ג', supports: 'exempt' },
];

function evidence(position, points, reason, source, component) {
  const ballot = PARTIES.find(([letters]) => letters === position.letters);
  if (!ballot || PARTY_NOTICES[position.letters]?.kind === 'withdrawn') return [];
  return [{ ...position, name: ballot[1], points, reason, source, component, basis: 'policy' }];
}

export function normalizeBurdenAnswer(answer, expanded = true) {
  if (!Array.isArray(answer)) return [];
  return BURDEN_GROUPS.slice(0, expanded ? 2 : 1).flatMap(group => {
    const selected = group.options.map(option => option.id).filter(id => answer.includes(id));
    // Reject contradictory imported state rather than silently choosing a side.
    return selected.length === 1 ? selected : [];
  });
}

export function scoreBurden(answer) {
  const selected = normalizeBurdenAnswer(answer);
  const results = [];
  const draft = selected.find(id => ['draft', 'exempt'].includes(id));
  if (draft) for (const position of DRAFT_POSITIONS) {
    results.push(...evidence(position, position.supports === draft ? 1 : -1,
      position.supports === 'draft' ? 'לפי סקירת עמדות המפלגות, הרשימה תומכת בחובת שירות רחבה, עם שירות צבאי או אזרחי לפי צורכי המדינה.' : 'לפי סקירת עמדות המפלגות, הרשימה מתנגדת לחובת גיוס ללומדי התורה ומגינה על הפטור.', draftSource, 'גיוס חרדים'));
  }
  const outposts = selected.find(id => ['limit-outposts', 'protect-outposts'].includes(id));
  if (outposts) {
    results.push(...evidence({ id: 'democrats', letters: 'אמת' }, outposts === 'limit-outposts' ? 1 : -1,
      'הדמוקרטים מתחייבים לצמצם מאחזים וחוות מבודדים כדי להפחית משימות הגנה ועומס מילואים.', democratsSource, 'משימות הגנה'));
    results.push(...evidence({ id: 'religious-zionism', letters: 'ט' }, outposts === 'protect-outposts' ? 1 : -1,
      'הציונות הדתית מציגה את הרחבת החוות ואת מעטפת הביטחון שלהן כהישג אסטרטגי. השיוך לרשימה המשותפת מבוסס על מרכיב הציונות הדתית.', farmsSource, 'משימות הגנה'));
  }
  return results;
}

export function scoreThreat(answer) {
  if (!['hamas', 'pa'].includes(answer)) return [];
  return [
    ...evidence({ id: 'religious-zionism', letters: 'ט' }, answer === 'pa' ? 1 : -1,
      'השיוך במשקל נקודה אחת הוא פרשנות לסדר העדיפויות שהציג סמוטריץ׳ בזירה המדינית. הוא אינו טענה שתמך בחמאס או דירוג של קורבנות.', smotrichSource, 'סדר עדיפויות מדיני'),
    ...evidence({ id: 'democrats', letters: 'אמת' }, answer === 'hamas' ? 1 : -1,
      'מסמך החזון של הדמוקרטים מציג מאבק בכוח הצבאי של חמאס לצד מהלך מדיני והיפרדות. השיוך הוא פרשנות לגישה הזו, לא תשובה מפורשת להשוואה בין הארגונים.', 'https://democrats.org.il/wp-content/uploads/2026/04/vision0426.pdf', 'סדר עדיפויות מדיני'),
  ].map(item => ({ ...item, basis: 'interpretation' }));
}
