# TODO

## Questionnaire content

- [ ] Agree on the actual choices for “מה הכי חשוב לך?”. The invented sample topics have been removed.
- [x] Support multiple selection; selecting authority disables the other choices, and deselecting authority restores earlier choices. The named topics are “דת ומדינה” and “מלחמה וחלום”; one TODO choice remains.
- [x] Build category routes from a shared question catalog, deduplicate shared questions, and show incremental question costs and dynamic progress. See [question flow](docs/question-flow.md).
- [ ] Write further sourced questions for each topic.
- [x] Extend religion/transport to three sourced dilemmas, with skipping and combined scores. Unwritten topics still stop at an explicit TODO.
- [x] Add a first sourced, explained scoring model for historical parties in the Yehudit Bridge case. See [the scoring model](docs/bridge-scoring.md).
- [x] Map sourced historical evidence to current electoral lists, average predecessors per question, and disclose partial membership and unmapped history. See [current-list mapping](docs/current-lists.md).
- [ ] Expand evidence to unscored current lists and their current positions, and combine scores across further dilemmas.
- [x] Allow continuing without topic selections; show a brief joke, then enter the default category dilemmas without inventing selections.
- [x] Exclude skips from scoring, show per-party evidence coverage, and show no ranking when all dilemmas are skipped.
- [ ] Develop humor and useful insights for the other branches together.

## Next topic: דת ומדינה

- [x] Add the topic to the first question, replacing one TODO choice.
- [x] Implement the first dilemma about the construction of Yehudit Bridge, with two answer choices and optional sourced background. See [the source notes](docs/yehudit-bridge.md).
- [ ] Choose and source the next real political dilemmas, including the alternatives available at the time.
- [ ] Write the next questions and answer choices together, before implementing them.
- [ ] Develop the humor and useful context for each answer.
- [x] Add the Na'im Busofash dilemma with expansion, ban and current-arrangement choices. See [source notes](docs/naim-busofash.md).
- [x] Add the October 7 morning preparedness dilemma as the final question shared by either active category, with sourced background and at most one negative ministerial responsibility point for Likud; no positive points or speculative scores for other parties. See [source notes](docs/emergency-transit.md).

The welcome line is “השאלון שמבוסס על דילמות פוליטיות אמיתיות שקרו”. Both active categories have sourced questions and combined party scoring; current-list mapping is implemented; further topics and broader source coverage remain TODOs.

## מלחמה וחלום

- [x] Add the category and a two-choice dream question with skipping and sourced one-point vision affinities. See [vision mapping](docs/visions.md).
- [x] Share the October 7 transport question with religion/transport, without duplicating it or its score.
- [x] Separate positive, zero and negative totals so a single negative result cannot appear as a positive match.
- [x] Add the shared conscription question, expanded into independent conscription/outpost choices for security interest, and a sourced Hamas/PA policy question scored from executed decisions and a resignation. See [sources and model](docs/burden-and-threat.md).
- [x] Add an illustrative burden meter with brief personal-cost scenes, history restoration and reduced-motion support.
- [x] Replace the Hamas/PA platform/clarification scoring with executed government decisions and a resignation in protest.
- [ ] Find documented actions to replace declared positions in the remaining conscription/outpost scoring; keep current position-based evidence labeled explicitly.
- [ ] Broaden the documented party coverage for the new policy questions.
- [ ] Broaden vision coverage to more lists and prefer a current primary party source for Raam over the quoted 2025 chairman statement.

## Ballot data

- [x] Show a sourced result notice for announced withdrawals; Blue and White remains selectable to catch outdated recommendations. See [party notices](docs/party-notices.md).
- [ ] Verify every party name, ballot letter, and eligibility against official Central Elections Committee publications. The current data is a secondary-source prototype snapshot.
- [ ] Decide how ballot data will be updated for future elections.

## Verification

- [ ] Reproduce the reported Safari failure on the welcome screen against the deployed URL. The `Object.hasOwn` dependency in scoring and `instant` scroll behavior have been removed, but neither explains an initial blank screen. Local WebKit exits before opening a page, so Safari verification remains pending.
- [ ] Visually review the full-page layout on desktop and mobile, including large text, zoom, and long party names.
- [ ] Review the hover cutscene with a real mouse and the focus-triggered equivalent with a keyboard, including reduced-motion settings.

DOM tests cover the welcome screen, exclusive authority selection, browser Back/Forward with restored choices and canceled timers, desktop hover and keyboard cutscenes, the timed mobile confirmation, robot self-awareness acknowledgement, automatic continuation, results, and restart. Visual browser checks remain outstanding because the current execution environment blocks browser preview infrastructure.
