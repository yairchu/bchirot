import { PARTIES, PARTY_NOTICES } from './parties.js';

const draftSource = 'https://www.mako.co.il/news-israel-elections/2026/Article-4a2f820efe911a1027.htm';
const farmsSource = 'https://zionutdatit.org.il/hityashvut/farms/';
const democratsSource = 'https://democrats.org.il/content/annexation-jewish-majority';
const cashSource = 'https://www.timesofisrael.com/en-route-to-paris-netanyahu-defends-qatari-cash-shipments-into-gaza/amp/';
const paFundsSource = 'https://www.timesofisrael.com/liveblog_entry/smotrich-formally-withholds-millions-from-pa-says-he-has-no-interest-for-it-to-exist/';
const resignationSource = 'https://www.calcalist.co.il/articles/0%2C7340%2CL-3749788%2C00.html';
const outpostBurdenSource = 'https://www.mako.co.il/news-military/2026_q3/Article-d2e9ea66e62af91027.htm';

export const WOMEN_SERVICE_SOURCE = 'https://www.ynet.co.il/news/article/rj1zgtdej';

export const SERVICE_CHOICES = [
  { id: 'serve-haredim', label: 'חרדים' },
  { id: 'serve-women', label: 'נשים' },
  { id: 'serve-other-men', label: 'גברים לא חרדים' },
];

export const BURDEN_GROUPS = [
  { id: 'outposts', title: 'צריך את כל חוות הבודדים?', options: [
    { id: 'limit-outposts', label: 'להגביל נקודות מבודדות' },
    { id: 'protect-outposts', label: 'לאפשר ולהגן עליהן' },
  ] },
  { id: 'partners', title: 'לנסות למצוא שותפים לביטחון?', note: 'חמולות מקומיות, הרש״פ, מועצת השלום או כוחות בינלאומיים — לפי התאמה, אמינות ופיקוח.', options: [
    { id: 'seek-partners', label: 'לחפש שותפים, עם תנאים ופיקוח' },
    { id: 'self-reliance', label: 'להסתמך על צה״ל בלבד' },
  ] },
];

export const BURDEN_TIMELINE = [
  { text: 'המפלגות חלוקות בשאלת השירות: יש הדורשות חובת שירות רחבה, ויש המבקשות להגן על הפטור ללומדי תורה. קיימות גם עמדות ביניים שלא הושוו כאן אוטומטית לפטור או לחובה גורפת.', url: draftSource, source: 'עמדות המפלגות בגיוס, N12, ‏8.10.2026' },
  { text: 'לפי דיווח N12, הגנה על נקודות מבודדות דורשת לעיתים ליווי, סיורים ותגבורי כוחות, ובמקרים מסוימים מסיטה כוחות ממשימות אחרות. אין כאן אומדן של מספר ימי המילואים שייחסכו.', url: outpostBurdenSource, source: 'משימות ההגנה בפועל, N12' },
  { text: 'הדמוקרטים מציגים את צמצום המאחזים והחוות המבודדים כדרך להפחית את משימות ההגנה ואת עומס המילואים. זהו טיעון המפלגה, ולא חישוב של מספר ימי מילואים שייחסכו.', url: democratsSource, source: 'עמדת הדמוקרטים' },
  { text: 'הציונות הדתית מציגה את החוות כאמצעי לאחיזה במרחב ומתארת מעטפת ביטחון ותיאום עם הגורמים הממונים. השאלה בוחנת את העדיפות בין האחיזה בשטח למשאבי ההגנה הנדרשים.', url: farmsSource, source: 'עמדת הציונות הדתית' },
  { text: 'באוקטובר 2022 החליט צה״ל לקבע את שירות לוחמות הטנקים בהגנת הגבולות, אחרי התנסות והערכת עמידה בקריטריונים מקצועיים ומבצעיים. מדובר בהגנת גבולות, ולא בפתיחת כל תפקידי השריון המתמרן.', url: WOMEN_SERVICE_SOURCE, source: 'החלטת צה״ל על לוחמות הטנקים, 27.10.2022' },
  { text: 'הבחירה כאן עוסקת בחובת שירות לקבוצות שסומנו, ולא באיסור על אחרות להתנדב או בזכאות לתפקיד קרבי. השיבוץ לפי התאמה; מי שאינו נדרש לצבא יכול לשרת בשירות אזרחי. המשך בלי סימון מוביל לשאלת המשך הומוריסטית בתרחיש ללא צבא; אין לכך ניקוד מפלגתי.', url: WOMEN_SERVICE_SOURCE, source: 'פרטי ההחלטה והקריטריונים' },
  { text: 'בנובמבר 2025 מועצת הביטחון אישרה מסגרת למועצת השלום ולכוח ייצוב בינלאומי בעזה. אישור מסגרת אינו מבטיח פריסה, הצלחה או החלפה מלאה של משימות צה״ל.', url: 'https://www.un.org/unispal/document/security-council-meeting-coverage-17nov25/', source: 'מועצת הביטחון, החלטה 2803' },
  { text: 'ביוני 2025 נתניהו אישר שישראל תומכת בחמולות בעזה המתנגדות לחמאס. זהו ניסיון ממשי להיעזר בגורמים מקומיים, ולא הוכחה שהם שותפים אמינים לאורך זמן. הרשות, חמולות מקומיות וגופים בינלאומיים אינם חלופות זהות.', url: 'https://www.timesofisrael.com/liveblog_entry/netanyahu-confirms-arming-gazan-clans-whats-wrong-with-that/', source: 'אישור התמיכה בחמולות, 5.6.2025' },
  { text: 'מציאת שותפים יעילים עשויה לאפשר חלוקת משימות. המד ממחיש את הכיוון המבוקש, בתנאי ששיתוף הפעולה מצליח; הוא אינו מציג הקלה שהושגה כבר. לחלופת השותפים ולשירות נשים וגברים לא חרדים אין כרגע ניקוד מפלגתי.', url: 'https://www.un.org/unispal/document/security-council-meeting-coverage-17nov25/', source: 'מסגרת כוח הייצוב ותנאיה' },
];

export const THREAT_DILEMMA = {
  title: 'חמאס הוא נכס?',
  context: 'ב־2018 ממשלת נתניהו אישרה הכנסת כסף קטארי לעזה שבשליטת חמאס, בין היתר לתשלום משכורות במנגנון השלטון שלו. ב־2023 ממשלת נתניהו וסמוטריץ׳ פעלו גם לקיזוז כספים מהרשות הפלסטינית. האם נכון לשמר את הפיצול ביניהם, גם במחיר ביסוס שלטון חמאס?',
  note: 'השאלה היא על מדיניות בפועל. אפשר להתנגד לשני הגופים, ואפשר לדלג אם החלופות לא מייצגות אותך.',
  options: [
    { id: 'hamas', label: 'לא לחזק את שלטון חמאס כדי לשמר את הפיצול', detail: 'להפסיק את מדיניות הכסף המחזקת את שלטונו, ולבחון חלופה של הרשות בכפוף לצורכי הביטחון.' },
    { id: 'pa', label: 'לשמר את הפיצול ולהחליש את הרשות', detail: 'למנוע התחזקות של הנהגה פלסטינית מאוחדת, גם במחיר המשך שלטון חמאס בעזה.' },
  ],
  timeline: [
    { text: 'בנובמבר 2018 הוכנסו לעזה באישור ישראל 15 מיליון דולר במזומן מקטאר, בין היתר למשכורות עובדי ממשל חמאס. לצד המימון השלטוני הועבר גם סיוע למשפחות עניות. המדיניות הוצגה אז כאמצעי להשגת שקט ולהקלה הומניטרית.', url: cashSource, source: 'העברת הכסף, 11.11.2018' },
    { text: 'בינואר 2023 סמוטריץ׳ חתם על קיזוז 139 מיליון ש״ח מכספי הרשות והעברתם למשפחות נפגעי טרור. המהלך בוצע בעקבות פניית הרשות לערכאות בינלאומיות, והקטין את הכספים שהועברו אליה.', url: paFundsSource, source: 'חתימת הצו, 8.1.2023' },
    { text: 'בנובמבר 2018 ליברמן התפטר מתפקיד שר הביטחון. הוא מנה את העברת הכסף ואת הפסקת האש עם חמאס כשתי נקודות המפנה. זו פעולה פוליטית מתועדת, ללא הסקת תמיכה שלו בחיזוק הרשות.', url: resignationSource, source: 'התפטרות ליברמן, 14.11.2018' },
    { text: 'ביסוס שלטון חמאס והחלשת הרשות הם האופן שבו השאלון מפרש את כיוון הצעדים. ההחלטות והתאריכים מתועדים; אין כאן קביעה שכל הכסף שימש ללחימה, שכל ממשלות נתניהו פעלו באופן זהה, או שכל שותפה בממשלה תמכה בכל צעד.', url: cashSource, source: 'פרטי העברת הכסף' },
  ],
};

// An illustrative direction, deliberately independent of party points and days of service.
export function burdenLevel(answer, expanded = true) {
  const selected = normalizeBurdenAnswer(answer, expanded);
  const serving = SERVICE_CHOICES.filter(choice => selected.includes(choice.id)).length;
  const tasks = selected.filter(id => !SERVICE_CHOICES.some(choice => choice.id === id));
  // Each group added widens the service pool; this is qualitative, not population weighting.
  const serviceChange = serving ? SERVICE_CHOICES.length - 2 * serving : 0;
  const taskChange = tasks.reduce((sum, id) => sum + (['protect-outposts', 'self-reliance'].includes(id) ? 1 : -1), 0);
  const baseline = SERVICE_CHOICES.length + BURDEN_GROUPS.length;
  return { value: baseline + serviceChange + taskChange, baseline, max: 2 * baseline, answered: Number(serving > 0) + tasks.length, total: expanded ? 1 + BURDEN_GROUPS.length : 1 };
}

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
  const service = SERVICE_CHOICES.map(choice => choice.id).filter(id => answer.includes(id));
  const tasks = (expanded ? BURDEN_GROUPS : []).flatMap(group => {
    const selected = group.options.map(option => option.id).filter(id => answer.includes(id));
    // Reject contradictory imported state rather than silently choosing a side.
    return selected.length === 1 ? selected : [];
  });
  return [...service, ...tasks];
}

export function scoreBurden(answer) {
  const selected = normalizeBurdenAnswer(answer);
  const results = [];
  const serviceAnswered = SERVICE_CHOICES.some(choice => selected.includes(choice.id));
  const draft = serviceAnswered ? (selected.includes('serve-haredim') ? 'draft' : 'exempt') : null;
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
  const direction = answer === 'pa' ? 1 : -1;
  return [
    ...evidence({ id: 'likud', letters: 'מחל' }, 2 * direction,
      'ממשלת נתניהו אישרה בנובמבר 2018 הכנסת כסף קטארי ששימש בין היתר למשכורות במנגנון שלטון חמאס. משקל 2 להחלטת ממשלה מתועדת; אין טענה שכל הכסף שימש למטרות צבאיות.', cashSource, 'מימון שלטון חמאס').map(item => ({ ...item, basis: 'action' })),
    ...evidence({ id: 'religious-zionism', letters: 'ט' }, direction,
      'סמוטריץ׳ חתם בינואר 2023 על קיזוז 139 מיליון ש״ח מכספי הרשות לטובת משפחות נפגעי טרור. משקל 1 לרכיב החלשת הרשות בלבד; אין כאן ייחוס של החלטת הכסף הקטארי מ־2018 לרשימה הנוכחית.', paFundsSource, 'קיזוז כספי הרשות').map(item => ({ ...item, basis: 'partial-action' })),
    ...evidence({ id: 'yisrael-beitenu', letters: 'ל' }, -direction,
      'ליברמן התפטר מתפקיד שר הביטחון בנובמבר 2018 במחאה על המדיניות מול חמאס, וציין את העברת הכסף ואת הפסקת האש. משקל 1 להתנגדות שהובילה לפרישה; אין בכך קביעה שתמך בחיזוק הרשות.', resignationSource, 'פרישה במחאה על המדיניות').map(item => ({ ...item, basis: 'partial-action' })),
  ];
}
