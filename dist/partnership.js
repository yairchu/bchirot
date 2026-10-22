import { PARTIES, PARTY_NOTICES } from './parties.js';

const representationSource = 'https://www.idi.org.il/articles/66220';
const representationHistorySource = 'https://www.zman.co.il/727367/';
const lawSource = 'https://m.knesset.gov.il/EN/News/PressReleases/Pages/press16726w.aspx';
const concernsSource = 'https://www.academy.ac.il/News/NewsItem.aspx?id=3386&nodeId=658';
const democratsVoteSource = 'https://democrats.org.il/content/exclusion-of-women';
const academicChoiceSource = 'https://law.tau.ac.il/sites/law.tau.ac.il/files/media_server/law_heb/Law_Society_Culture/books/Haredim/11_Noya%20Rimlat.pdf#page=44';
const academicPreferencesSource = 'https://lawjournal.huji.ac.il/article/12/1667';
const womenServiceSource = 'https://www.idf.il/כתבות-ועדכונים/2022/אוקטובר/נשים-לוחמות-טנקיסטיות-לוחמות-טנקים-חיל-הגנת-הגבולות-זרוע-היבשה/';
const womenProtectionSource = 'https://www.mako.co.il/news-military/politics-q3_2018/Article-e44259de0da6461004.htm';
const womenCommitteeSource = 'https://oknesset.org/meetings/2/2/2229819.html';

export const WOMEN_SERVICE_DILEMMA = {
  title: 'האם נשים צריכות לשרת בצה״ל?',
  context: 'ב־2022 צה״ל החליט לשבץ נשים באופן קבוע כלוחמות טנקים בהגנת הגבולות, לאחר התנסות ובדיקת התאמה מקצועית. מעבר לפתיחת תפקידים, האם נשים צריכות להיות שותפות בחובת השירות?',
  note: 'השאלה עוסקת בחובת שירות לפי התאמה לתפקיד, ולא בחובת לחימה לכולן. פטור מחובה אינו איסור להתנדב.',
  options: [
    { id: 'serve', label: 'כן, שירות צבאי לפי התאמה לתפקיד' },
    { id: 'exempt', label: 'לא, לפטור נשים משירות צבאי' },
  ],
  timeline: [
    { text: 'באוקטובר 2022 צה״ל קבע שהתנסות לוחמות הטנקים בהגנת הגבולות הצליחה ושהשיבוץ יהפוך לקבוע. ההחלטה התבססה על עמידה בקריטריונים מקצועיים ומבצעיים; היא עסקה בהגנת גבולות, ולא בכל תפקידי השריון המתמרן.', url: womenServiceSource, source: 'החלטת צה״ל על לוחמות הטנקים, 27.10.2022' },
    { text: 'בדיוני חוק הגיוס ב־2018 סמוטריץ׳ דרש להסיר סעיף שנועד להגן על מעמד הנשים ושילובן בצה״ל בעת גיוס חרדים. זהו ניסיון לשנות הגנה על שילוב נשים, ולא חוק שביטל את שירותן. הניקוד לציונות הדתית מבוסס על פעילותו, בלי לייחס עמדה אחידה לכל ישיבות ההסדר או לכל הציבור הדתי.', url: womenProtectionSource, source: 'הדרישה להסרת ההגנה, N12, ‏2018' },
    { text: 'בדיון ועדת הכנסת ב־7.5.2025 מרב מיכאלי מהעבודה דרשה לקדם שיבוץ לפי כישורים ולהסיר חסמים בפני נשים. זו פעילות פרלמנטרית לקידום השילוב; היא משויכת לרכיב העבודה בדמוקרטים.', url: womenCommitteeSource, source: 'פרוטוקול הוועדה, 7.5.2025' },
    { text: 'הניקוד הוא נקודה אחת בכיוון השילוב או נגדו, על בסיס פעילות פרלמנטרית מוגבלת. אין כאן הוכחה לתמיכה או להתנגדות לכל פטור מגיוס או לכל תפקיד לחימה. ההחלטה המקצועית של צה״ל אינה מקור לניקוד מפלגתי.', url: womenCommitteeSource, source: 'הדיון וגבולות ההשוואה' },
  ],
};

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
  note: 'גם כשאין חובה רשמית ללמוד בהפרדה, לחץ חברתי עשוי להשפיע על הבחירה במסלול.',
  options: [
    { id: 'expand', label: 'לאפשר הפרדה גם בתואר שני ושלישי' },
    { id: 'limit', label: 'להשאיר את ההפרדה לתואר ראשון בלבד' },
    { id: 'ban', label: 'לא לאפשר מסלולי לימודים בהפרדה', detail: 'הפרדה עלולה להדיר נשים ולצמצם את חופש הבחירה גם לחרדים.' },
  ],
  timeline: [
    { text: 'ב־16 ביולי 2026 אושר תיקון מס׳ 12 לחוק זכויות הסטודנט, ביוזמת לימור סון הר מלך מעוצמה יהודית, ברוב של 52 מול 43. במוסדות מעורבים הוגבלה ההפרדה לכיתות הלימוד ולסטודנטים שבחרו במסלול.', url: lawSource, source: 'אישור החוק, הכנסת, 16.7.2026' },
    { text: 'האקדמיה הלאומית למדעים התנגדה להרחבה והזהירה מפגיעה במחקר, בסטודנטים ובאפשרויות ההוראה של מרצות. זו הערכת הסיכונים של האקדמיה, ולא תוצאה שנמדדה אחרי החקיקה.', url: concernsSource, source: 'עמדת האקדמיה הלאומית למדעים, 7.7.2026' },
    { text: 'כשמסלול נפרד הופך לציפייה חברתית, לימודים במסלול רגיל עלולים להיתפס כחריגה מנורמות הקהילה. פרופ׳ נויה רימלט מתארת כיצד התבססות ההפרדה מצמצמת כך את חופש הבחירה של חרדים וחרדיות, גם כשהמסלולים מוצגים כרצוניים.', url: academicChoiceSource, source: 'נויה רימלט, תוכניות אקדמיות נפרדות לחרדים, עמ׳ 406–407' },
    { text: 'מחקרה של נטע ברק־קורן מבחין בין הפרדה בכיתה, הפרדה בקמפוס ומגדר המרצה, ומוצא שהחשיבות המיוחסת להם שונה. העמדות בציבור החרדי אינן אחידות, ולכן אין להניח שכולם זקוקים לאותו סוג של מסלול.', url: academicPreferencesSource, source: 'נטע ברק־קורן, מחקר עמדות, משפטים, 2019' },
    { text: 'הדמוקרטים פרסמו תיעוד שלפיו חברי סיעת העבודה הצביעו נגד ההרחבה. הצבעה זו אינה מעידה כשלעצמה על תמיכה בביטול כל המסלולים הנפרדים, ולכן אינה מעניקה להם נקודות בבחירה הזו. קידום ההרחבה בידי סון הר מלך נחשב נקודת מחלוקת עם הבחירה בביטול.', url: democratsVoteSource, source: 'תיעוד ההצבעה וגבולות הניקוד' },
  ],
};

function records(positions, direction) {
  return positions.flatMap(position => {
    const ballot = PARTIES.find(([letters]) => letters === position.letters);
    if (!ballot || PARTY_NOTICES[position.letters]?.kind === 'withdrawn') return [];
    return [{ ...position, name: ballot[1], points: position.position * direction }];
  });
}

export function scoreWomenService(answer) {
  if (!['serve', 'exempt'].includes(answer)) return [];
  return records([
    { id: 'democrats', letters: 'אמת', position: 1, basis: 'partial-action', reason: 'מרב מיכאלי מהעבודה פעלה בדיון ועדת הכנסת במאי 2025 להסרת חסמים ולשיבוץ נשים לפי כישורים. זהו רכיב העבודה בדמוקרטים ועדות לכיוון השילוב, ללא מסקנה על כל פרט בחובת השירות.', source: womenCommitteeSource, component: 'שירות נשים בצה״ל' },
    { id: 'religious-zionism', letters: 'ט', position: -1, basis: 'partial-action', reason: 'סמוטריץ׳ דרש ב־2018 להסיר מחוק הגיוס הגנה על מעמד הנשים ושילובן. זהו ניסיון לשינוי חקיקה, לא ביטול שירות נשים בפועל; השיוך לרשימה מבוסס על רכיב הציונות הדתית.', source: womenProtectionSource, component: 'שירות נשים בצה״ל' },
  ], answer === 'serve' ? 1 : -1);
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
  if (!['expand', 'limit', 'ban'].includes(answer)) return [];
  const positions = [
    { id: 'otzma-yehudit', letters: 'ב', position: 1, basis: 'action', reason: 'לימור סון הר מלך מעוצמה יהודית יזמה את החוק שאושר להרחבת ההפרדה לתארים מתקדמים.', source: lawSource, component: 'הפרדה בתארים מתקדמים' },
    { id: 'democrats', letters: 'אמת', position: -1, basis: 'partial-action', reason: 'לפי תיעוד ההצבעה שפרסמו הדמוקרטים, חברי סיעת העבודה הצביעו נגד ההרחבה. המקור כאן הוא פרסום המפלגה על הצבעה בפועל.', source: democratsVoteSource, component: 'הפרדה בתארים מתקדמים' },
  ];
  // Opposition to extending segregation does not establish support for a full ban.
  const supported = answer === 'ban' ? positions.filter(position => position.id === 'otzma-yehudit') : positions;
  return records(supported, answer === 'expand' ? 1 : -1);
}

const sidewalkPetitionSource = 'https://www.inn.co.il/news/701567';
const sidewalkResponsibilitySource = 'https://www.idi.org.il/articles/63046';
const sidewalkMinisterSource = 'https://www.gov.il/BlobFolder/reports/planjob040526/he/planjob2026.pdf';
const sidewalkUpdateSource = 'https://www.israelhayom.co.il/news/local/article/21290484';

export const SIDEWALK_DILEMMA = {
  title: 'גם למדרכה יש מגדר?',
  context: 'בבני ברק ובבית שמש הוצבו שלטים להפרדה בין נשים לגברים במדרכות. התומכים ביקשו לשמור על הצניעות; המתנגדים טענו שברחוב ציבורי כל אדם צריך לבחור היכן ללכת. מה נכון לעשות?',
  options: [
    { id: 'separate', label: 'לאפשר הכוונה למדרכות נפרדות' },
    { id: 'free-choice', label: 'בלי הכוונה מגדרית ברחוב — כל אחד ואחת יבחרו היכן ללכת' },
  ],
  timeline: [
    { text: 'בבית שמש תועד ב־2011 שלט שהורה לנשים לחצות לצד השני של הכביש מטעמי צניעות.', url: 'https://www.mako.co.il/news-israel/local/Article-ed2d260c8816431017.htm', source: 'השלט בבית שמש, N12, ‏2011' },
    { text: 'ביולי 2026 דווח על שילוט להפרדה במדרכות בבני ברק. העירייה מסרה שהקריאה היא יוזמת רבני העיר, שהיא סייעה בהרחבת התשתיות בגלל הצפיפות, ושאין מדובר בהנחיה או באכיפה עירונית. השאלה עוסקת בהכוונה במדרכה ציבורית, ולא בהפרדה בתוך אולם פרטי.', url: sidewalkPetitionSource, source: 'המקרה ותגובת העירייה, ערוץ 7, 15.7.2026' },
    { text: 'יאיא פינק ומיכל רוזין הגישו עתירה נגד ההפרדה. הפעולה מעניקה לדמוקרטים נקודת זיקה אחת נגד ההכוונה המגדרית, על בסיס פעילות אישים במפלגה ולא הצבעה של סיעה שלמה. לעוצמה יהודית יש ניקוד נפרד על בסיס הערכת אחריות מיניסטריאלית לאכיפה.', url: sidewalkPetitionSource, source: 'העתירה נגד ההפרדה וגבולות הניקוד' },
    { text: 'בן גביר הוא השר לביטחון לאומי הממונה על המשטרה. הניקוד לעוצמה יהודית משקף הערכה עריכתית של אחריותו לטיפול בתופעה בתקופתו, ולא עדות שהורה לאפשר הפרדה או מנע אכיפה.', url: sidewalkMinisterSource, source: 'זהות השר, תוכנית העבודה של המשרד ל־2026' },
    { text: 'לשר סמכות לקבוע מדיניות כללית וסדרי עדיפויות ולפקח על המשטרה, לצד עצמאותה בהחלטות מבצעיות ובחקירות מסוימות. בבחירה נגד ההפרדה מופחתת נקודה לעוצמה יהודית כהערכת אחריות; בבחירה בעד הפרדה אין לה נקודת זכות.', url: sidewalkResponsibilitySource, source: 'סמכות השר וגבולות האחריות, המכון הישראלי לדמוקרטיה' },
    { text: 'לאחר הסרת שלטים ביולי, דווח ב־27 באוגוסט על הצבתם מחדש. לכן אין כאן טענה שההפרדה בוטלה סופית או שבית המשפט כבר הכריע בעתירה.', url: sidewalkUpdateSource, source: 'השלטים הוצבו מחדש, ישראל היום, 27.8.2026' },
  ],
};

export function scoreSidewalk(answer) {
  if (!['separate', 'free-choice'].includes(answer)) return [];
  const result = records([
    { id: 'democrats', letters: 'אמת', position: 1, basis: 'partial-action', reason: 'יאיא פינק ומיכל רוזין הגישו ביולי 2026 עתירה נגד ההפרדה במדרכות בני ברק. זו פעילות של אישים במפלגה, ולא הצבעה של הסיעה כולה.', source: sidewalkPetitionSource, component: 'הפרדה במדרכות' },
  ], answer === 'free-choice' ? 1 : -1);
  if (answer === 'free-choice') result.push(...records([
    { id: 'otzma-yehudit', letters: 'ב', position: -1, basis: 'responsibility', reason: 'מינוס נקודה לעוצמה יהודית משקף הערכה עריכתית של אחריות השר לביטחון לאומי בן גביר לטיפול בהפרדה במדרכות בתקופתו. זו אחריות למדיניות כללית ולפיקוח על המשטרה; לא נמצאה כאן ראיה שהורה להתיר הפרדה או מנע אכיפה. אין ניקוד זכות לחלופה התומכת בהפרדה.', source: sidewalkResponsibilitySource, followupSource: sidewalkUpdateSource, followupLabel: 'התופעה בתקופת כהונת השר', component: 'הפרדה במדרכות' },
  ], 1));
  return result;
}

const minorsLawInitiativesSource = 'https://main.knesset.gov.il/News/PressReleases/Pages/PR_1609.aspx';
const minorsLawPassageSource = 'https://main.knesset.gov.il/News/PressReleases/Pages/press041113-16.aspx';
const minorsLawOppositionSource = 'https://main.knesset.gov.il/News/PressReleases/Pages/press260613p.aspx';
const minorsCommitteeSource = 'https://main.knesset.gov.il/News/PressReleases/Pages/press01072026v.aspx';
const minorsReportSource = 'https://www.ynet.co.il/judaism/article/s1b00k00xnfl';
const minorsPodcastSource = 'https://omny.fm/shows/ad-hakaze/15';
const minorsDocumentarySource = 'https://www.kan.org.il/content/kan/kan-11/p-11454/';
const minorsTestimonySource = 'https://www.mako.co.il/news-politics/2026_q3/Article-55b17c44bedc0a1027.htm';
const minorsConnectionsSource = 'https://www.ynet.co.il/judaism/discourse/article/hkcvrxf4ze';
const minorsLikudSource = 'https://13tv.co.il/item/news/politics/politics/k02un-905367863/';
const minorsEducationSource = 'https://www.israelhayom.co.il/news/local/article/21261772';

export const MINORS_PROTECTION_DILEMMA = {
  title: 'מי שומר על הילדות?',
  context: 'על קהילת ״היכל הקודש״ ביבנאל פורסמו עדויות על נישואי קטינות בכפייה ועל תופעה נרחבת של פגיעות מיניות בילדות בגיל הרך. למרות החשיפות, אין אכיפה מספקת שעוצרת את התופעה. איך המדינה צריכה לפעול?',
  options: [
    { id: 'enforce', label: 'אכיפה יזומה והגנה על הקטינות, גם מול התנגדות הנהגת הקהילה', detail: 'משטרה, רווחה ופיקוח על מוסדות החינוך.' },
    { id: 'community-first', label: 'לכבד את חופש הדת ולאפשר לקהילה לנהוג לפי מנהגיה' },
  ],
  timeline: [
    { text: 'בסדרה התיעודית ״בשם האב״ של כאן 11 מרואיינת אישה המעידה שנאנסה כשהייתה ילדה בגן, ומתארת פגיעות בילדות נוספות. העדות עוסקת בפגיעה בגיל הרך, בנפרד מעדויות על השאת נערות קטינות בכפייה.', url: minorsDocumentarySource, source: 'בשם האב, כאן 11, ‏2023' },
    { text: 'בפרק ״בת 15 מתחתנת וכולם שותקים״ בהסכת ״עד הקצה״ של כאן, אורן אהרוני פוגש את שרה מימוני, שנישאה בגיל 15. הפרק עוסק בהמשך התופעה ובאחריות להגנה על הנערות, על רקע תלונות ועדויות שהצטברו לאורך השנים.', url: minorsPodcastSource, source: 'להאזנה: עד הקצה, כאן — בת 15 מתחתנת וכולם שותקים' },
    { text: 'בדיון בכנסת בספטמבר 2026 נשמעו עדויות של הורים ויוצאות הקהילה על נישואים בכפייה ופגיעות מיניות בילדים. אלו עדויות המחייבות בדיקה והגנה, ולא פסקי דין נגד כל חברי הקהילה. השאלה אינה מייחסת מעשים לכל חסידי ברסלב או לכל תושבי יבנאל.', url: minorsTestimonySource, source: 'העדויות בוועדה, N12, ‏23.9.2026' },
    { text: 'לפי סיכום ועדה בין־משרדית שפורסם באוקטובר 2026, בשנים 2024–2025 לא נפתחו ביבנאל תיקים בגין נישואי קטינים, וב־2026 נפתחו תשעה תיקים שהיו בחקירה בעת הכנת הדוח. המשטרה גם עצרה טקסים חשודים. פעולות נקודתיות אינן מעידות שהתופעה נעצרה; הביקורת בשאלה היא על היעדר אכיפה מספקת שמגינה על הילדות.', url: minorsReportSource, source: 'ממצאי הוועדה והחקירות, ynet, ‏19.10.2026' },
    { text: 'מירב כהן מיש עתיד כינסה דיונים ודיוני מעקב, דרשה נתונים ופעלה לקידום טיפול מערכתי. שתי הנקודות לביחד נשענות על פעילותה המתמשכת ברכיב יש עתיד, ולא על פעולה אישית של בנט. נקודות המחלוקת לעוצמה יהודית ולליכוד הן הערכת אחריות של השרים לביטחון לאומי ולחינוך, ולא קביעה שהם הורו למנוע אכיפה.', url: minorsCommitteeSource, source: 'דיון המעקב בכנסת, 1.7.2026' },
    { text: 'באוגוסט 2026 פנתה כהן לשר החינוך יואב קיש בדרישה להתערב, בעקבות דיווח על מנהלת החשודה בהשאת בנותיה הקטינות וממשיכה בתפקידה. זו עדות להתרעה בנושא שבאחריות המשרד, ולא הרשעה של המנהלת.', url: minorsEducationSource, source: 'הפנייה לשר החינוך, ישראל היום, 23.8.2026' },
    { text: 'תחקיר שומרים תיאר קשרים בין הנהגת הקהילה לאריה דרעי וש״ס, ותרומות של יצחק מירילשוילי, מבעלי ערוץ 14, לעמותה הקשורה לקהילה. קשרים ותרומות אינם כשלעצמם הוכחה לידיעה על עבירות או להתערבות בחקירות. נקודת המחלוקת לש״ס נשענת על התנגדותה הפרלמנטרית להרחבת ההגנה על קטינים, המתועדת בהמשך.', url: minorsConnectionsSource, source: 'תחקיר שומרים על הקשרים והמימון, פורסם ב־ynet' },
    { text: 'ב־2012 קידמו את העלאת גיל הנישואים יריב לוין מהליכוד, זהבה גלאון ממרצ, דב חנין מחד״ש ונציגי בל״ד, לצד אורית זוארץ מקדימה. זו פעילות נגד נישואי קטינים בכלל, ולא אכיפה ביבנאל או עמדה בכל טענת פגיעה מינית. קדימה אינה משויכת כאן לרשימה נוכחית.', url: minorsLawInitiativesSource, source: 'יוזמי החקיקה, הכנסת, 6.3.2012' },
    { text: 'דוד רותם מישראל ביתנו הוביל כיו״ר ועדת החוקה את הכנת החוק, שאושר ב־2013. נקודה לרשימה מבוססת על פעילות זו, ולא על השערה כיצד ליברמן היה מטפל ביבנאל כיום.', url: minorsLawPassageSource, source: 'אישור החוק והכנתו בוועדה, הכנסת, 4.11.2013' },
    { text: 'ש״ס ויהדות התורה הגישו ערעור נגד החלת דין רציפות על הצעת החוק להעלאת גיל הנישואים. ההתנגדות מקבלת נקודת מחלוקת חלקית בבחירה באכיפה; אין בכך טענה שהמפלגות תמכו באונס או בנישואים בגיל הגן.', url: minorsLawOppositionSource, source: 'הערעור הפרלמנטרי, הכנסת, 26.6.2013' },
    { text: 'חדשות 13 פרסמו עדויות על התפקדות מאורגנת לליכוד, ובהן טענות להבטחת סלי מזון ולרישום ללא ידיעת המתפקדות. מדובר בטענות שפורסמו בתחקיר; לא הוכח כאן שההתפקדות גרמה להימנעות מאכיפה.', url: minorsLikudSource, source: 'תחקיר ההתפקדות, חדשות 13, ‏23.9.2026' },
  ],
};

export function scoreMinorsProtection(answer) {
  if (!['enforce', 'community-first'].includes(answer)) return [];
  const component = 'הגנה על קטינות ביבנאל';
  const result = records([
    { id: 'beyachad', letters: 'רק', position: 2, basis: 'sustained-action', reason: 'שתי נקודות לפעילות המתמשכת של מירב כהן: דיוני מעקב, דרישת נתונים ופניות לרשויות בנושא יבנאל. השיוך לביחד מבוסס על יש עתיד, ולא על מעשה אישי של בנט.', source: minorsCommitteeSource, component },
    { id: 'yisrael-beitenu', letters: 'ל', position: 1, basis: 'partial-action', reason: 'דוד רותם מישראל ביתנו הוביל בוועדת החוקה את הכנת חוק גיל הנישואים שאושר ב־2013. זו עדות חקיקתית חלקית, ללא ייחוס טיפול אישי ביבנאל לליברמן.', source: minorsLawPassageSource, component },
    { id: 'democrats', letters: 'אמת', position: 1, basis: 'partial-action', reason: 'זהבה גלאון ונציגי מרצ קידמו את העלאת גיל הנישואים. השיוך לדמוקרטים הוא דרך מרצ; זו חקיקה כללית, לא פעולה מתועדת ביבנאל.', source: minorsLawInitiativesSource, component },
    { id: 'joint-list', letters: 'ודם', position: 1, basis: 'partial-action', reason: 'דב חנין מחד״ש ונציגי בל״ד קידמו את העלאת גיל הנישואים. הפעילות משויכת לרכיבים ברשימה המשותפת ונשקלת פעם אחת; אינה מייצגת כל פרט בעמדת הרשימה.', source: minorsLawInitiativesSource, component },
    { id: 'likud', letters: 'מחל', position: 1, basis: 'partial-action', reason: 'יריב לוין מהליכוד היה מיוזמי העלאת גיל הנישואים. הפעילות החקיקתית מוצגת לצד האחריות המאוחרת לפיקוח על מוסדות החינוך.', source: minorsLawInitiativesSource, component },
  ], answer === 'enforce' ? 1 : -1);
  if (answer === 'enforce') result.push(...records([
    { id: 'shas', letters: 'שס', position: -1, basis: 'partial-action', reason: 'ש״ס הגישה ערעור נגד קידום העלאת גיל הנישואים ב־2013. זו התנגדות פרלמנטרית להגנה רחבה יותר, לא הוכחה לתמיכה בפגיעות מיניות. הקשרים המתועדים להנהגת הקהילה מובאים כרקע, ללא קביעה על חסימת חקירות.', source: minorsLawOppositionSource, followupSource: minorsConnectionsSource, followupLabel: 'תחקיר הקשרים להנהגת הקהילה', component },
    { id: 'utj', letters: 'ג', position: -1, basis: 'partial-action', reason: 'יהדות התורה ערערה נגד קידום העלאת גיל הנישואים ב־2013. זו עדות חלקית להתנגדות להגבלה חוקית, ולא ראיה לתמיכה בפגיעה מינית בילדים.', source: minorsLawOppositionSource, component },
    { id: 'otzma-yehudit', letters: 'ב', position: -1, basis: 'responsibility', reason: 'מינוס נקודה לעוצמה יהודית כהערכת אחריות מיניסטריאלית של בן גביר למדיניות ולפיקוח על המשטרה מול כשל האכיפה המתמשך. חקירות ופעולות נקודתיות ב־2026 אינן פוטרות מאחריות לטיפול שלא עצר את התופעה. זו הערכת אחריות, ולא קביעה שהשר חסם חקירה.', source: minorsReportSource, followupSource: sidewalkResponsibilitySource, followupLabel: 'סמכות השר וגבולותיה', component },
    { id: 'likud', letters: 'מחל', position: -1, basis: 'responsibility', reason: 'הערכת אחריות מיניסטריאלית של יואב קיש לפיקוח על מוסדות החינוך, לאחר התרעות בנושא נישואי קטינות והפנייה אליו באוגוסט 2026. הניקוד אינו מבוסס על התפקדות לליכוד ואינו קביעה שהשר הגן על עבריינים.', source: minorsEducationSource, component },
  ], 1));
  return result;
}
