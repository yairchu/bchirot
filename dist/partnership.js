import { PARTIES, PARTY_NOTICES } from './parties.js';

const representationSource = 'https://www.idi.org.il/articles/66220';
const representationHistorySource = 'https://www.zman.co.il/727367/';
const lawSource = 'https://m.knesset.gov.il/EN/News/PressReleases/Pages/press16726w.aspx';
const concernsSource = 'https://www.academy.ac.il/News/NewsItem.aspx?id=3386&nodeId=658';
const democratsVoteSource = 'https://democrats.org.il/content/exclusion-of-women';

export const REPRESENTATION_DILEMMA = {
  title: 'מי יושב סביב שולחן ההחלטות?',
  context: 'ש״ס ויהדות התורה מעולם לא הציבו נשים ברשימותיהן לכנסת, בעוד שבמפלגות אחרות נשים מכהנות כחברות כנסת וכשרות. איזו רשימה היית רוצה שתייצג אותך?',
  note: 'זו שאלה על הרשימה המועדפת עליך, ולא על איסור התמודדות של רשימות אחרות.',
  options: [
    { id: 'men-only', label: 'רשימה של גברים בלבד' },
    { id: 'inclusive', label: 'רשימה שמשלבת נשים וגברים' },
    { id: 'equal', label: 'רשימה שפועלת לייצוג שוויוני יותר' },
  ],
  timeline: [
    { text: 'רשימות ש״ס ויהדות התורה לכנסת מורכבות מגברים בלבד לאורך השנים, ללא מועמדות גם במקומות שאינם ריאליים.', url: representationHistorySource, source: 'הרשימות לאורך השנים, זמן ישראל, 27.9.2026' },
    { text: 'סקירת רשימות 2026 מצאה ייצוג קרוב לאיזון אצל הדמוקרטים, ישר וביחד, לעומת ייצוג מצומצם בליכוד. ההשוואה מתייחסת למקומות שהוגדרו כריאליים לפי סקרים; היא אינה תוצאת הבחירות.', url: representationSource, source: 'הרכב הרשימות שהוגשו, 22.9.2026' },
    { text: 'בהעדפה לשילוב שוויוני יותר, רשימות קרובות לאיזון מקבלות נקודת התאמה, רשימות ללא נשים נקודת מחלוקת, וליכוד מקבל אפס: יש בו נשים, אך הרכבו שנבדק רחוק מאיזון. הניקוד נשען על הרכב הרשימה, ולא על הבטחה לשינוי בעתיד.', url: representationSource, source: 'הבסיס להבחנה בין נוכחות לאיזון' },
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
  if (!['inclusive', 'men-only', 'equal'].includes(answer)) return [];
  const positions = [
    { id: 'likud', letters: 'מחל', position: 1, balanced: false, basis: 'action', reason: 'בליכוד 13% נשים במקומות שנבדקו בסקירת רשימות 2026; זהו שילוב נשים, אך הרכב רחוק מאיזון.' },
    { id: 'beyachad', letters: 'רק', position: 1, balanced: true, basis: 'action', reason: 'ברשימת ביחד 46% נשים במקומות שנבדקו בסקירת רשימות 2026.' },
    { id: 'democrats', letters: 'אמת', position: 1, balanced: true, basis: 'action', reason: 'ברשימת הדמוקרטים 50% נשים במקומות שנבדקו בסקירת רשימות 2026.' },
    { id: 'yashar', letters: 'דרך', position: 1, balanced: true, basis: 'action', reason: 'ברשימת ישר 48% נשים במקומות שנבדקו בסקירת רשימות 2026.' },
    { id: 'shas', letters: 'שס', position: -1, basis: 'action', reason: 'ש״ס לא הציבה מעולם נשים ברשימותיה לכנסת.', source: representationHistorySource },
    { id: 'utj', letters: 'ג', position: -1, basis: 'action', reason: 'יהדות התורה לא הציבה מעולם נשים ברשימותיה לכנסת.', source: representationHistorySource },
  ].map(position => ({ ...position, source: position.source || representationSource, component: 'ייצוג נשים בכנסת' }));
  if (answer === 'equal') return records(positions.map(position => ({ ...position, position: position.position < 0 ? -1 : position.balanced ? 1 : 0 })), 1);
  return records(positions, answer === 'inclusive' ? 1 : -1);
}

export function scoreAcademia(answer) {
  if (!['expand', 'limit'].includes(answer)) return [];
  return records([
    { id: 'otzma-yehudit', letters: 'ב', position: 1, basis: 'action', reason: 'לימור סון הר מלך מעוצמה יהודית יזמה את החוק שאושר להרחבת ההפרדה לתארים מתקדמים.', source: lawSource, component: 'הפרדה בתארים מתקדמים' },
    { id: 'democrats', letters: 'אמת', position: -1, basis: 'partial-action', reason: 'לפי תיעוד ההצבעה שפרסמו הדמוקרטים, חברי סיעת העבודה הצביעו נגד ההרחבה. המקור כאן הוא פרסום המפלגה על הצבעה בפועל.', source: democratsVoteSource, component: 'הפרדה בתארים מתקדמים' },
  ], answer === 'expand' ? 1 : -1);
}
