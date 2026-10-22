import test from 'node:test';
import assert from 'node:assert/strict';
import { afterRobot, progress, questionRoute, questionnaireQuestions, additionalQuestionCount } from '../dist/flow.js';
import { PARTIES, BALLOT_CHOICES, BLANK_BALLOT, FAKE_BALLOT } from '../dist/parties.js';

test('no gets the confirmation scene on all devices; yes gets the acknowledgement', () => {
  assert.equal(afterRobot('no'), 'sure');
  assert.equal(afterRobot('yes'), 'robot-thanks');
});

test('the counter uses four authority questions and five religion/transport questions', () => {
  assert.deepEqual(progress('topics'), { current: 1, total: null });
  assert.deepEqual(progress('bridge'), { current: 2, total: 5 });
  assert.deepEqual(progress('weekend'), { current: 3, total: 5 });
  assert.deepEqual(progress('emergency'), { current: 4, total: 5 });
  assert.deepEqual(progress('draft'), { current: 5, total: 5 });
  assert.deepEqual(progress('party', { authority: true }), { current: 2, total: 4 });
  assert.deepEqual(progress('robot', { authority: true }), { current: 3, total: 4 });
  assert.deepEqual(progress('sure', { authority: true }), { current: 4, total: 4 });
});

test('the shared question appears once for either topic or both and routes have a stable order', () => {
  assert.deepEqual(questionRoute(['religion-transport']), ['bridge', 'weekend', 'emergency', 'draft']);
  assert.deepEqual(questionRoute(['war-dream']), ['dream', 'burden', 'burden-tasks', 'threat', 'emergency']);
  const both = ['dream', 'burden', 'burden-tasks', 'threat', 'bridge', 'weekend', 'emergency'];
  assert.deepEqual(questionRoute(['war-dream', 'religion-transport']), both);
  assert.deepEqual(questionRoute(['religion-transport', 'war-dream']), both);
  assert.deepEqual(questionRoute([]), []);
  assert.deepEqual(questionnaireQuestions([]), ['bridge', 'weekend', 'emergency', 'draft']);
  assert.deepEqual(questionnaireQuestions(['modesty-partnership']), ['representation', 'academia', 'women-service']);
});

test('compact draft replaces the roster only without security and never adds a no-army branch', () => {
  for (const topics of [[], ['religion-transport']]) {
    for (const noArmy of [false, true]) {
      assert.deepEqual(questionnaireQuestions(topics, { noArmy }), ['bridge', 'weekend', 'emergency', 'draft']);
    }
  }
  for (const topics of [['war-dream'], ['war-dream', 'religion-transport']]) {
    for (const noArmy of [false, true]) {
      const route = questionnaireQuestions(topics, { noArmy });
      assert.equal(route.includes('draft'), false);
      assert.equal(route.filter(id => id === 'burden').length, 1);
    }
  }
});

test('incremental costs reflect overlap and selected contributions sum to the actual length', () => {
  assert.equal(additionalQuestionCount('religion-transport'), 4);
  assert.equal(additionalQuestionCount('war-dream'), 5);
  assert.equal(additionalQuestionCount('war-dream', ['religion-transport']), 3);
  assert.equal(additionalQuestionCount('religion-transport', ['war-dream']), 2);
  for (const selected of [['religion-transport', 'war-dream'], ['war-dream', 'religion-transport'], ['modesty-partnership', 'war-dream']]) {
    assert.equal(selected.reduce((sum, topic) => sum + additionalQuestionCount(topic, selected), 0), questionRoute(selected).length);
  }
});

test('partnership omits its compact service question whenever the security roster is included', () => {
  assert.equal(additionalQuestionCount('modesty-partnership'), 3);
  for (const topics of [[], ['religion-transport'], ['war-dream'], ['religion-transport', 'war-dream']]) {
    for (const noArmy of [false, true]) {
      const before = questionRoute(topics, { noArmy });
      const added = topics.includes('war-dream') ? ['representation', 'academia'] : ['representation', 'academia', 'women-service'];
      assert.deepEqual(questionRoute([...topics, 'modesty-partnership'], { noArmy }), [...before, ...added]);
      assert.deepEqual(questionRoute(['modesty-partnership', ...topics], { noArmy }), [...before, ...added]);
      assert.equal(additionalQuestionCount('modesty-partnership', topics), added.length);
    }
  }
  const topics = ['modesty-partnership'];
  assert.deepEqual(progress('representation', { topics }), { current: 2, total: 4 });
  assert.deepEqual(progress('academia', { topics }), { current: 3, total: 4 });
  assert.deepEqual(progress('women-service', { topics }), { current: 4, total: 4 });
  assert.equal(additionalQuestionCount('war-dream', topics), 4);
  assert.equal(additionalQuestionCount('war-dream', ['religion-transport', ...topics]), 2);
});

test('progress follows the selected union and updates the topic screen total', () => {
  const topics = ['war-dream'];
  assert.deepEqual(progress('dream', { topics }), { current: 2, total: 6 });
  assert.deepEqual(progress('emergency', { topics }), { current: 6, total: 6 });
  assert.deepEqual(progress('topics', { topics }), { current: 1, total: 6 });
  assert.deepEqual(progress('topics', { topics, authority: true }), { current: 1, total: 4 });
  const both = { topics: [...topics, 'religion-transport'] };
  assert.deepEqual(progress('bridge', both), { current: 6, total: 8 });
  assert.deepEqual(progress('emergency', both), { current: 8, total: 8 });
});

test('blank ballot is a separate answer and not one of the official party choices', () => {
  assert.equal(BALLOT_CHOICES.length, PARTIES.length + 2);
  assert.equal(new Set(BALLOT_CHOICES.map(([value]) => value)).size, BALLOT_CHOICES.length);
  assert.ok(BALLOT_CHOICES.includes(BLANK_BALLOT));
  assert.equal(PARTIES.includes(BLANK_BALLOT), false);
});

test('fictional ballot follows קה and stays outside official party data', () => {
  const index = BALLOT_CHOICES.indexOf(FAKE_BALLOT);
  assert.equal(BALLOT_CHOICES[index - 1][0], 'קה');
  assert.equal(PARTIES.includes(FAKE_BALLOT), false);
});

test('all 38 ballot choices have unique letters and usable names', () => {
  assert.equal(PARTIES.length, 38);
  assert.equal(new Set(PARTIES.map(party => party[0])).size, PARTIES.length);
  assert.ok(PARTIES.every(([letters, name]) => letters.length && name.length));
});


test('no-army adds a follow-up and replaces tasks, with accurate progress for each category', () => {
  assert.deepEqual(questionnaireQuestions(['war-dream'], { noArmy: true }), ['dream', 'burden', 'no-army', 'threat', 'emergency']);
  assert.deepEqual(questionnaireQuestions(['religion-transport'], { noArmy: true }), ['bridge', 'weekend', 'emergency', 'draft']);
  assert.deepEqual(progress('draft', { topics: ['religion-transport'], noArmy: true }), { current: 5, total: 5 });
  assert.deepEqual(progress('emergency', { topics: ['war-dream'], noArmy: true }), { current: 6, total: 6 });
  assert.equal(questionnaireQuestions(['war-dream', 'religion-transport'], { noArmy: true }).filter(id => id === 'no-army').length, 1);
});
