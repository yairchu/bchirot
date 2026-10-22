import { PARTIES, PARTY_NOTICES } from './parties.js';

const representationSource = 'https://www.idi.org.il/articles/53253';
const lawSource = 'https://m.knesset.gov.il/EN/News/PressReleases/Pages/press16726w.aspx';
const concernsSource = 'https://www.academy.ac.il/News/NewsItem.aspx?id=3386&nodeId=658';
const democratsVoteSource = 'https://democrats.org.il/content/exclusion-of-women';

export const REPRESENTATION_DILEMMA = {
  title: 'מי יושב סביב שולחן ההחלטות?',
  context: 'במרץ 2024 כיהנו בש״ס וביהדות התורה רק גברים, בעוד שבסיעות אחרות כיהנו גם נשים. איזו רשימה היית רוצה שתייצג אותך?',
  note: 'זו שאלה על הרשימה המועדפת עליך, ולא על איסור התמודדות של רשימות אחרות.',
  options: [
    { id: 'inclusive', label: 'רשימה שמשלבת נשים וגברים' },
    { id: 'men-only', label: 'רשימה של גברים בלבד' },
  ],
  timeline: [
    { text: 'סקירת המכון הישראלי לדמוקרטיה מ־2024 תיעדה נשים בסיעות הליכוד, יש עתיד והעבודה, ולעומתן סיעות ללא נשים ובהן ש״ס ויהדות התורה. מדובר בהרכב בפועל בנקודת זמן מוגדרת.', url: representationSource, source: 'ייצוג נשים בכנסת, מרץ 2024' },
    { text: 'הניקוד בוחן השתתפות בפועל, ולא שוויון מספרי או מדיניות בנושאים אחרים. לביחד נלקח כאן הרכיב של יש עתיד, ולדמוקרטים הרכיב של העבודה. אין מכאן מסקנה על כל מרכיבי הרשימות הנוכחיות.', url: representationSource, source: 'הנתונים לפי סיעה' },
  ],
};

export const ACADEMIA_DILEMMA = {
  title: 'תואר שני, כיתה נפרדת?',
  context: 'ביולי 2026 הכנסת הרחיבה את האפשרות ללימודים בהפרדה בין נשים לגברים גם לתואר שני ושלישי. התומכים ביקשו לפתוח דלת למי שאינם לומדים בכיתות מעורבות. המתנגדים הזהירו מפגיעה בשוויון ובהזדמנויות למרצות. מה היה נכון לעשות?',
  note: 'השאלה עוסקת במסלולים נפרדים לבחירה, לצד לימודים משותפים.',
  options: [
    { id: 'expand', label: 'לאפשר הפרדה גם בתואר שני ושלישי' },
    { id: 'limit', label: 'להשאיר את ההפרדה לתואר ראשון בלבד' },
  ],
  timeline: [
    { text: 'ב־16 ביולי 2026 אושר תיקון מס׳ 12 לחוק זכויות הסטודנט, ביוזמת לימור סון הר מלך מעוצמה יהודית, ברוב של 52 מול 43. במוסדות מעורבים הוגבלה ההפרדה לכיתות הלימוד ולסטודנטים שבחרו במסלול.', url: lawSource, source: 'אישור החוק, הכנסת, 16.7.2026' },
    { text: 'האקדמיה הלאומית למדעים התנגדה להרחבה והזהירה מפגיעה במחקר, בסטודנטים ובאפשרויות ההוראה של מרצות. זו הערכת הסיכונים של האקדמיה, ולא תוצאה שנמדדה אחרי החקיקה.', url: concernsSource, source: 'עמדת האקדמיה הלאומית למדעים, 7.7.2026' },
    { text: 'הדמוקרטים פרסמו תיעוד שלפיו חברי סיעת העבודה הצביעו נגד החוק. הניקוד הראשוני מתייחס לקידום החוק בידי סון הר מלך ולהצבעה המתועדת בפרסום המפלגה; לשאר הרשימות לא יוחסה כאן עמדה ללא בדיקה נוספת.', url: democratsVoteSource, source: 'תיעוד ההצבעה בפרסום הדמוקרטים' },
  ],
};

function records(positions, direction) {
  return positions.flatMap(position => {
    const ballot = PARTIES.find(([letters]) => letters === position.letters);
    if (!ballot || PARTY_NOTICES[position.letters]?.kind === 'withdrawn') return [];
    return [{ ...position, name: ballot[1], points: position.position * direction }];
  });
}

export function scoreRepresentation(answer) {
  if (!['inclusive', 'men-only'].includes(answer)) return [];
  const positions = [
    { id: 'likud', letters: 'מחל', position: 1, basis: 'action', reason: 'במרץ 2024 כיהנו נשים בסיעת הליכוד.' },
    { id: 'beyachad', letters: 'רק', position: 1, basis: 'partial-action', reason: 'נשים כיהנו ביש עתיד; העדות נוגעת לרכיב זה בביחד בלבד.' },
    { id: 'democrats', letters: 'אמת', position: 1, basis: 'partial-action', reason: 'נשים כיהנו בסיעת העבודה, מרכיב בדמוקרטים.' },
    { id: 'shas', letters: 'שס', position: -1, basis: 'action', reason: 'במרץ 2024 כיהנו בסיעת ש״ס גברים בלבד.' },
    { id: 'utj', letters: 'ג', position: -1, basis: 'action', reason: 'במרץ 2024 כיהנו בסיעת יהדות התורה גברים בלבד.' },
  ].map(position => ({ ...position, source: representationSource, component: 'ייצוג נשים בכנסת' }));
  return records(positions, answer === 'inclusive' ? 1 : -1);
}

export function scoreAcademia(answer) {
  if (!['expand', 'limit'].includes(answer)) return [];
  return records([
    { id: 'otzma-yehudit', letters: 'ב', position: 1, basis: 'action', reason: 'לימור סון הר מלך מעוצמה יהודית יזמה את החוק שאושר להרחבת ההפרדה לתארים מתקדמים.', source: lawSource, component: 'הפרדה בתארים מתקדמים' },
    { id: 'democrats', letters: 'אמת', position: -1, basis: 'partial-action', reason: 'לפי תיעוד ההצבעה שפרסמו הדמוקרטים, חברי סיעת העבודה הצביעו נגד ההרחבה. המקור כאן הוא פרסום המפלגה על הצבעה בפועל.', source: democratsVoteSource, component: 'הפרדה בתארים מתקדמים' },
  ], answer === 'expand' ? 1 : -1);
}
