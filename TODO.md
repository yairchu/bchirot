# TODO

## Questionnaire content

- [ ] Agree on the actual choices for “מה הכי חשוב לך?”. The invented sample topics have been removed.
- [x] Support multiple selection; selecting authority disables the other choices, and deselecting authority restores earlier choices. The first named topic is “דת ותחבורה”; one TODO choice remains.
- [ ] Write follow-up questions for each topic, including their branching rules and question counts.
- [ ] Extend the independent-judgment branch beyond the first religion/transport dilemma. Unwritten content still stops at an explicit TODO; both result restart buttons return to question one.
- [x] Add a first sourced, explained scoring model for historical parties in the Yehudit Bridge case. See [the scoring model](docs/bridge-scoring.md).
- [ ] Define how to map historical parties onto current electoral lists and combine scores across further dilemmas.
- [ ] Develop humor and useful insights for the other branches together.

## Next topic: דת ותחבורה

- [x] Add the topic to the first question, replacing one TODO choice.
- [x] Implement the first dilemma about the construction of Yehudit Bridge, with two answer choices and optional sourced background. See [the source notes](docs/yehudit-bridge.md).
- [ ] Choose and source the next real political dilemmas, including the alternatives available at the time.
- [ ] Write the next questions and answer choices together, before implementing them.
- [ ] Develop the humor and useful context for each answer.
- [x] Finish the current religion/transport route at question 2 of 2 with sourced party scores.

The welcome line is “השאלון שמבוסס על דילמות פוליטיות אמיתיות שקרו”. The first sourced dilemma and historical-party scoring work; further topics and current-list mapping remain TODOs.

## Ballot data

- [ ] Verify every party name, ballot letter, and eligibility against official Central Elections Committee publications. The current data is a secondary-source prototype snapshot.
- [ ] Decide how ballot data will be updated for future elections.

## Verification

- [ ] Visually review the full-page layout on desktop and mobile, including large text, zoom, and long party names.
- [ ] Review the hover cutscene with a real mouse and the focus-triggered equivalent with a keyboard, including reduced-motion settings.

DOM tests cover the welcome screen, exclusive authority selection, browser Back/Forward with restored choices and canceled timers, desktop hover and keyboard cutscenes, the timed mobile confirmation, robot self-awareness acknowledgement, automatic continuation, results, and restart. Visual browser checks remain outstanding because the current execution environment blocks browser preview infrastructure.
