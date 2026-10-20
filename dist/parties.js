// Display labels are shortened; letters and names sourced 2026-10-21.
// https://bechirot.fyi/lists/26 (secondary compilation of CEC publications).
// Reverify against https://www.gov.il/he/pages/candidates-lists-26 before launch.
export const PARTIES = [
  ['מחל', 'הליכוד'], ['אמת', 'הדמוקרטים'], ['דרך', 'ישר! עם איזנקוט'],
  ['שס', 'ש״ס'], ['ג', 'יהדות התורה'], ['ודם', 'הרשימה המשותפת'],
  ['רק', 'ביחד בראשות נפתלי בנט'], ['עם', 'רע״ם'], ['כן', 'כחול לבן'],
  ['די', 'המילואימניקים והכלכלית'], ['ב', 'עוצמה יהודית'], ['ל', 'ישראל ביתנו'],
  ['ט', 'הציונות הדתית וזהות'], ['צף', 'הפיראטים'], ['קך', 'סדר חדש'],
  ['ך', 'עמך ישראל'], ['נר', 'צבע שחור'], ['ני', 'נעם לישראל'],
  ['קה', 'קול הנשים'], ['בקר', 'אורות השחר'], ['נקי', 'התיקון'],
  ['ק', 'תקומה'], ['בי', 'צומת בית ישראל'], ['זך', 'הציבור החרדי'],
  ['י', 'ישראל תחילה'], ['צדק', 'שרשר לאהבה ואחדות העם'], ['זץ', 'ברית עולם'],
  ['צבי', 'תנועת אחי'], ['בד', 'ביחד נצליח'], ['קץ', 'משפט צדק'],
  ['רץ', 'הקהל'], ['ד', 'השותפות לכולם'], ['ה', 'גן עדן'],
  ['פה', 'אני ואתה'], ['נץ', 'ביטחון אישי'], ['יק', 'גה״ת — גוש התנ״כי'],
  ['ז', 'בטח — בטחון חברתי'], ['נף', 'שמע'],
].sort((a, b) => a[0].localeCompare(b[0], 'he'));

// A questionnaire answer, not a party or an official ballot letter.
export const BLANK_BALLOT = ['blank', 'פתק לבן'];
export const FAKE_BALLOT = ['קקה', 'קקה'];
export const BALLOT_CHOICES = [
  ...PARTIES.flatMap(party => party[0] === 'קה' ? [party, FAKE_BALLOT] : [party]),
  BLANK_BALLOT,
];
export const BLANK_BALLOT_SOURCE = 'https://www.gov.il/he/departments/topics/faq-26';
