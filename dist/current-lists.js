import { PARTIES, PARTY_NOTICES } from './parties.js';
import { scoreReligion } from './scoring.js';
import { scoreRepresentation, scoreAcademia, scoreWomenService, scoreSidewalk, scoreMinorsProtection } from './partnership.js';
import { scoreVision } from './visions.js';
import { scoreDraft, scoreBurden, scoreThreat, normalizeBurdenAnswer, SERVICE_CHOICES } from './policy-questions.js';

export const MAPPING_CHECKED_ON = '2026-10-22';
const idi = 'https://www.idi.org.il/policy/parties-and-elections/parties/';

// Continuity maps evidence to a present ballot, not a claim about its current platform.
export const CURRENT_LIST_MAPPINGS = [
  { id: 'shas', letters: 'שס', historical: ['shas'], note: 'המשך של ש״ס.', source: 'https://bechirot.fyi/lists/26' },
  { id: 'utj', letters: 'ג', historical: ['utj'], note: 'המשך של יהדות התורה.', source: 'https://bechirot.fyi/lists/26' },
  { id: 'likud', letters: 'מחל', historical: ['likud', 'kulanu'], note: 'כולנו התאחדה עם הליכוד. המקורות של שתי המפלגות משוקללים פעם אחת לכל שאלה.', source: `${idi}kulanu/` },
  { id: 'democrats', letters: 'אמת', historical: ['labor', 'meretz'], note: 'הדמוקרטים הם איחוד העבודה ומרצ. המקורות של שתיהן משוקללים פעם אחת לכל שאלה.', source: `${idi}democrats/` },
  { id: 'beyachad', letters: 'רק', historical: ['yesh-atid', 'jewish-home'], note: 'ביחד כוללת את יש עתיד ואת בנט 2026. עדויות היסטוריות של יש עתיד ושל הבית היהודי בראשות בנט משוקללות פעם אחת לכל שאלה.', source: `${idi}beyachad/` },
  { id: 'yisrael-beitenu', letters: 'ל', historical: ['yisrael-beitenu'], note: 'המשך של ישראל ביתנו.', source: 'https://bechirot.fyi/lists/26' },
];

export function mapHistoricalScores(historicalScores) {
  return CURRENT_LIST_MAPPINGS.flatMap(mapping => {
    const ballot = PARTIES.find(([letters]) => letters === mapping.letters);
    if (!ballot || PARTY_NOTICES[mapping.letters]?.kind === 'withdrawn') return [];
    const questions = new Map();
    for (const party of historicalScores.filter(party => mapping.historical.includes(party.id))) {
      for (const item of party.contributions) {
        if (!questions.has(item.question)) questions.set(item.question, []);
        questions.get(item.question).push(item);
      }
    }
    const contributions = [...questions].map(([question, evidence]) => ({
      question,
      // One score per answered question: mergers do not increase its weight.
      points: evidence.reduce((sum, item) => sum + item.points, 0) / evidence.length,
      evidence,
    }));
    if (!contributions.length) return [];
    return [{ ...mapping, name: ballot[1], contributions, points: contributions.reduce((sum, item) => sum + item.points, 0) }];
  }).sort((a, b) => b.contributions.length - a.contributions.length || b.points - a.points || a.name.localeCompare(b.name, 'he'));
}

export function scoreCurrentReligion(bridgeAnswer, weekendAnswer, emergencyAnswer = null, dreamAnswer = null, { childProtectionAnswer = null, sidewalkAnswer = null, womenServiceAnswer = null, representationAnswer = null, academiaAnswer = null, draftAnswer = null, burdenAnswer = null, burdenTasksAnswer = null, threatAnswer = null } = {}) {
  const results = mapHistoricalScores(scoreReligion(bridgeAnswer, weekendAnswer, emergencyAnswer));
  const serviceRoster = normalizeBurdenAnswer(burdenAnswer, false);
  for (const evidence of scoreVision(dreamAnswer)) {
    let party = results.find(party => party.id === evidence.id);
    if (!party) {
      party = { id: evidence.id, name: evidence.name, letters: evidence.letters, points: 0, contributions: [], note: 'זיקה ראשונית לחזון מוצהר, במשקל נקודה אחת.', source: evidence.source };
      results.push(party);
    }
    party.contributions.push({ question: 'החלום שבחרת', points: evidence.points, evidence: [evidence] });
    party.points += evidence.points;
  }
  for (const [question, records] of [['הגנה על קטינות ביבנאל', scoreMinorsProtection(childProtectionAnswer)], ['הפרדה במדרכות', scoreSidewalk(sidewalkAnswer)], ['שירות נשים בצה״ל', scoreWomenService(serviceRoster.length ? null : womenServiceAnswer)], ['ייצוג נשים בכנסת', scoreRepresentation(representationAnswer)], ['הפרדה בתארים מתקדמים', scoreAcademia(academiaAnswer)], ['גיוס גברים חרדים', scoreDraft(draftAnswer)], ['מי צריך לשרת בצבא?', scoreBurden(serviceRoster)], ['אילו משימות צה״ל צריך לשאת?', scoreBurden(normalizeBurdenAnswer(burdenTasksAnswer).filter(id => !SERVICE_CHOICES.some(choice => choice.id === id)))], ['חמאס והרשות', scoreThreat(threatAnswer)]]) {
    for (const evidence of records) {
      let party = results.find(party => party.id === evidence.id);
      if (!party) {
        party = { id: evidence.id, name: evidence.name, letters: evidence.letters, points: 0, contributions: [], note: 'הניקוד מבוסס על העמדה והמקור המפורטים בכל רכיב שנענה.', source: evidence.source };
        results.push(party);
      }
      let contribution = party.contributions.find(item => item.question === question);
      if (!contribution) {
        contribution = { question, points: 0, evidence: [] };
        party.contributions.push(contribution);
      }
      contribution.evidence.push(evidence);
      contribution.points += evidence.points;
      party.points += evidence.points;
    }
  }
  return results.sort((a, b) => b.contributions.length - a.contributions.length || b.points - a.points || a.name.localeCompare(b.name, 'he'));
}

export function unscoredCurrentLists(scores) {
  return PARTIES.filter(([letters]) => PARTY_NOTICES[letters]?.kind !== 'withdrawn' && !scores.some(party => party.letters === letters));
}
