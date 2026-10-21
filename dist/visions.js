import { PARTIES, PARTY_NOTICES } from './parties.js';

// A weak affinity to a stated aspiration, not a prediction of feasibility or
// an assertion that parties outside this researched sample reject that dream.
export const VISION_AFFINITIES = [
  {
    id: 'religious-zionism', letters: 'ט', dream: 'whole-land',
    reason: 'הציונות הדתית מציגה באתרה החלת ריבונות ביהודה, שומרון ובקעת הירדן. זו זיקה לחזון שנבחר, לפי מרכיב הציונות הדתית ברשימה המשותפת עם זהות.',
    source: 'https://zionutdatit.org.il/hityashvut/sovereignty/',
  },
  {
    id: 'otzma-yehudit', letters: 'ב', dream: 'whole-land',
    reason: 'עקרונות עוצמה יהודית כוללים החלת ריבונות על השטחים שהגיעו לשליטת ישראל ב־1967 והתיישבות בכל חלקי הארץ. זו זיקה לחזון, ולא בדיקה של היתכנותו או של כל מדיניות המפלגה.',
    source: 'https://ozma-yeudit.com/program/?lang=he',
  },
  {
    id: 'democrats', letters: 'אמת', dream: 'peace',
    reason: 'מסמך החזון של הדמוקרטים מאפריל 2026 מציע יוזמה מדינית לפתרון הסכסוך, היפרדות אחראית, חיזוק הסכמי שלום ובריתות אזוריות. מכאן הזיקה לחלום של הסדר ושלום מתמשך.',
    source: 'https://democrats.org.il/wp-content/uploads/2026/04/vision0426.pdf',
  },
  {
    id: 'raam', letters: 'עם', dream: 'peace',
    reason: 'לפי דיווח מ־27.3.2025, יו״ר רע״ם מנסור עבאס הציג יוזמת גשרים לפיוס ושלום והעדיף דרך של פיוס על מלחמה. זו זיקה על סמך הצהרת היו״ר, ולא מצע מלא או הערכת ביצוע.',
    source: 'https://www.news1.co.il/Archive/001-D-498911-00.html',
  },
];

export function scoreVision(answer) {
  return VISION_AFFINITIES.filter(item => item.dream === answer).flatMap(item => {
    const ballot = PARTIES.find(([letters]) => letters === item.letters);
    if (!ballot || PARTY_NOTICES[item.letters]?.kind === 'withdrawn') return [];
    return [{ ...item, name: ballot[1], points: 1, basis: 'vision' }];
  });
}
