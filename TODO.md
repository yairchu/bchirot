# TODO

## Questionnaire content

- [ ] Agree on the actual choices for “מה הכי חשוב לך?”. The invented sample topics have been removed.
- [ ] Restore multiple selection and the exclusive authority option once the other choices exist.
- [ ] Write follow-up questions for each topic, including their branching rules and question counts.
- [ ] Build the independent-judgment branch linked from the result. It currently stops at an explicit TODO.
- [ ] Decide how party positions will be sourced, compared, and explained before adding any matching results.
- [ ] Develop humor and useful insights for the other branches together.

## Ballot data

- [ ] Verify every party name, ballot letter, and eligibility against official Central Elections Committee publications. The current data is a secondary-source prototype snapshot.
- [ ] Decide how ballot data will be updated for future elections.

## Verification

- [ ] Visually review the full-page layout on desktop and mobile, including large text, zoom, and long party names.
- [ ] Review the hover cutscene with a real mouse and the focus-triggered equivalent with a keyboard, including reduced-motion settings.

DOM tests cover the welcome screen, desktop hover and keyboard cutscenes, automatic continuation, mobile skipping, results, and restart. Visual browser checks remain outstanding because the current execution environment blocks browser preview infrastructure.
