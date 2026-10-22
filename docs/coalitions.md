# Coalition connections after the results

Checked on 2026-10-22. This informational screen follows both scored results (including unanswered/unscored results) and ordinary authority-ballot results. It does not change scores, question counts or analytics payloads. Withdrawn-ballot notices retain their existing update path.

The first version covers 11 major current ballots from the existing party catalog. Its coverage is deliberately incomplete: an unmapped relation means unknown, never agreement or rejection. Other ballots are not covered yet. Selecting a party shows both directions, plus historical coalition membership where mapped. The selector replaces the current history entry so browser Back returns to the results and Forward restores the selected party.

## Evidence

- [ynet, 2026-10-11](https://www.ynet.co.il/news/elections2026/article/sy6ekitsfx): Bennett's final clarification, Lieberman's and Golan's statements oppose serving with Netanyahu; Eizenkot opposed Netanyahu serving as a minister. These are person-specific constraints, not unconditional vetoes of Likud under any leadership. The same report documents the opposition leaders' 2026-09-27 coordination and non-aggression agreement. This is recorded as coordination, never a coalition agreement. The article contains earlier and later Bennett statements; the record uses the later clarification.
- [IDI analysis of the 37th government's coalition agreements](https://www.idi.org.il/articles/46842): historical co-membership from December 2022. The current Religious Zionism–Zehut ballot receives a historical note about Religious Zionism only, not Zehut.
- [Knesset coalition agreements archive](https://m.knesset.gov.il/mk/government/pages/coalitionagreements.aspx), including [the 2021 Raam agreement](https://m.knesset.gov.il/mk/government/Documents/CA36-Raam.pdf): historical co-membership in the 36th coalition. Today's Beyachad and Democrats ballots are explicitly mapped through historical components, not treated as lists that existed in 2021. The archive can be geographically unavailable; membership is also described in [IDI's 2021 election history](https://www.idi.org.il/policy/parties-and-elections/elections/2021-1/).
- [ynet explanation of government formation, October 2026](https://www.ynet.co.il/news/elections2026/article/bjdwgoq2gg): 61 coalition seats confer an absolute majority; minority government with external support or abstentions is possible. Do not present 61 coalition members as an unconditional legal requirement for investiture.

## Mathematical interpretation

Willingness is directed. A real Hermitian matrix would be symmetric, which is not justified for unilateral declarations. Historical co-membership is symmetric, but is a different evidence layer. Neither unknown relations nor qualitative categories are assigned numerical weights.

Eigenvectors are not binary coalition membership vectors. Spectral methods on an appropriately defined numerical matrix might expose patterns, but would not enumerate feasible governments. Even unanimous pairwise compatibility does not establish agreement on an entire coalition, its leader, policies or external support. This version does not compute eigenvectors, seat totals, coalition probabilities or predicted blocs.

Future coverage should include more current sourced commitments, conditional agreements and historical examples. Preserve distinctions between a party, its leader, constituent parties, coalition membership and outside support. Add multiple evidence records when a new source conflicts with existing evidence rather than silently treating missing evidence as consent.
