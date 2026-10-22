# Coalition connections after the results

Checked on 2026-10-22. This additional scoring screen follows both scored results (including unanswered/unscored results) and ordinary authority-ballot results. It keeps the original party scores, question counts and analytics payloads unchanged, and adds a separate transformed ranking. Withdrawn-ballot notices retain their existing update path.

The first version covers 11 major current ballots from the existing party catalog. Its coverage is deliberately incomplete: an unmapped relation means unknown, never agreement or rejection. Other ballots are not covered yet. The visible matrix summarizes the mapped connections. Browser Back returns to the results and Forward restores the coalition screen. Detailed evidence remains in this document and the data module.

## Evidence

- [ynet, 2026-10-11](https://www.ynet.co.il/news/elections2026/article/sy6ekitsfx): Bennett's final clarification, Lieberman's and Golan's statements oppose serving with Netanyahu; Eizenkot opposed Netanyahu serving as a minister. These are person-specific constraints, not unconditional vetoes of Likud under any leadership. The same report documents the opposition leaders' 2026-09-27 coordination and non-aggression agreement. This is recorded as coordination, never a coalition agreement. The article contains earlier and later Bennett statements; the record uses the later clarification.
- [IDI analysis of the 37th government's coalition agreements](https://www.idi.org.il/articles/46842): historical co-membership from December 2022. The current Religious Zionism–Zehut ballot receives a historical note about Religious Zionism only, not Zehut.
- [Knesset coalition agreements archive](https://m.knesset.gov.il/mk/government/pages/coalitionagreements.aspx), including [the 2021 Raam agreement](https://m.knesset.gov.il/mk/government/Documents/CA36-Raam.pdf): historical co-membership in the 36th coalition. Today's Beyachad and Democrats ballots are explicitly mapped through historical components, not treated as lists that existed in 2021. The archive can be geographically unavailable; membership is also described in [IDI's 2021 election history](https://www.idi.org.il/policy/parties-and-elections/elections/2021-1/).
- [ynet explanation of government formation, October 2026](https://www.ynet.co.il/news/elections2026/article/bjdwgoq2gg): 61 coalition seats confer an absolute majority; minority government with external support or abstentions is possible. Do not present 61 coalition members as an unconditional legal requirement for investiture.

## Mathematical interpretation

Willingness is directed. A real Hermitian matrix would be symmetric, which is not justified for unilateral declarations. Historical co-membership is symmetric, but is a different evidence layer. Unknown relations receive no propagation weight. The evidence categories are converted to explicit model weights for the score transformation described below.

Eigenvectors are not binary coalition membership vectors. Spectral methods on an appropriately defined numerical matrix might expose patterns, but would not enumerate feasible governments. Even unanimous pairwise compatibility does not establish agreement on an entire coalition, its leader, policies or external support. This version does not compute eigenvectors, seat totals, coalition probabilities or predicted blocs.

Future coverage should include more current sourced commitments, conditional agreements and historical examples. Preserve distinctions between a party, its leader, constituent parties, coalition membership and outside support. Add multiple evidence records when a new source conflicts with existing evidence rather than silently treating missing evidence as consent.


## Score-vector transformation

For candidate i and scored party j, use W[i,j] = 1 for the party itself, 0.5 for documented bloc coordination, 0.25 for historical co-membership, 0.125 for documented historical negotiations that did not produce a coalition, and 0 otherwise. A sourced veto in either direction takes precedence, under the current leadership assumption; it is not a blanket prediction about a different Likud leader. Coordination takes precedence over historical membership, which takes precedence over historical negotiations; evidence categories are not added together. These are editorial model weights, not empirical probabilities.

The output is t[i] = sum(W[i,j] * s[j]) / sum(W[i,j]), restricting both candidates and terms to parties with observed direct scores and covered ballot mappings. Missing scores are excluded, not filled with zero. This is multiplication by a row-normalized matrix for the given coverage mask. Positive and negative scores both propagate. Normalization avoids rewarding a party merely because it has more mapped connections, and ensures a vector with no positive entries cannot generate a positive result. It does not correct the underlying quiz's differing evidence coverage across parties.

The screen shows all transformed results immediately, grouped into positive matches, zero scores and negative mismatches. Per-party arithmetic, the source-map explorer and the additional matrix explanation have been removed from the UI. The introduction describes coalition formation and ends with the punchline “פשוט. מכפילים את וקטור הציונים שלך במטריצת השותפויות.” This accurately describes the existing normalized matrix-vector multiplication based on sourced bloc coordination and historical partnerships, without adding spectral calculations. The matrix itself and its short legend explain the calculation; the eigenvector discussion belongs in this technical document, not the user-facing quiz. If no transformed score is positive, no positive match is presented. With no direct scores (including the authority shortcut), the screen invites the user to answer the opinion questions. It does not treat an authority-selected ballot as a score vector.

A candidate without mapped scored partners retains its direct score; its matrix row contains only its self-weight. Historical components of today's merged lists remain an imperfect modeling proxy. The transformation does not validate an entire coalition's pairwise compatibility or establish that the candidate could lead a government. Without seats, a statement about electoral influence or prime-ministerial likelihood would require assumptions this version does not make.


### Why eigenvectors do not enumerate compatible coalitions

A concrete counterexample is A = [[1,1,0],[1,1,1],[0,1,1]]. Parties 1 and 2 accept each other; so do 2 and 3; parties 1 and 3 refuse each other. The vector (1, sqrt(2), 1) is an eigenvector with eigenvalue 1 + sqrt(2). It has positive entries for all three parties despite their incompatibility. Conversely, the compatible pair (1,1,0) is not an eigenvector: A times this vector is (2,2,1). This example is already symmetric, so allowing directed matrices cannot establish a general identification of eigenvectors with feasible coalitions. Spectral patterns can remain useful for identifying broad affinities or clusters; pairwise vetoes require separate constraints.


## Visible matrix

A compact table displays the same normalized coefficients used in the score-vector transformation, restricted to parties with direct scores and kept in ballot-catalog order on both axes. Every row sums to one before display rounding. When no scores exist, the table instead labels and shows the unnormalized base weights for all covered parties.

Positive weights use five fixed green shade bands (below 0.125, 0.125–0.25, 0.25–0.5, 0.5–0.75, and 0.75–1), with stronger weights darker on the same absolute scale across rows. A documented veto is displayed as red zero; an unmapped connection is gray zero. These are distinct evidence states with the same zero propagation coefficient. The legend explicitly identifies both zero types as exact zeros rather than rounded values. Numeric labels use two significant digits so a tiny positive value cannot display as zero; accessible cell labels and tooltips retain its unrounded value and evidence type. No negative coefficients are invented for visualization: negative result scores still originate in the signed input vector. Headers have full accessible party names plus a visible ballot-letter key; a keyboard-focusable scrolling region contains the wide table on mobile.

A question directly precedes the plain “פשוט.” punchline, which carries no special color or emphasis.


## Raam connection corrections (2026-10-22)

The initial map omitted explicit refusals and treated the 2021 coalition as a positive proxy in cases where later statements contradicted it. The following corrections apply to both the displayed matrix and transformed scores, while preserving the historical records:

- [N12, 2026-10-15](https://www.mako.co.il/news-israel-elections/2026/Article-5b0d6cc444f31a1026.htm): Liberman explicitly ruled out Raam, the Joint List, Shas and UTJ, as well as minority-government support. Record four directed refusals; a refusal blocks propagation in both directions. In particular, Israel Beitenu–Raam no longer receives a positive coefficient from 2021 membership.
- [N12, 2026-02-02](https://www.mako.co.il/news-israel-elections/2026_q1/Article-75a42e70dcf1c91026.htm): Bennett ruled out a government relying on Arab parties. Apply the leader-specific veto to Raam and the Joint List under the explicit assumption of a Bennett-led proposed government. The statement predates today's merged Beyachad list; it is not presented as a joint declaration by all current components. Preserve the historical 2021 record separately.
- [ynet interview with Abbas, 2022-09-02](https://www.ynet.co.il/news/article/rkez4110ks): Abbas described negotiations in 2021, coalition-agreement offers and meetings with Netanyahu. He also described Likud's account that the talks concerned direct prime-ministerial elections, disputing that this was their sole purpose. Record this as attributed historical negotiation evidence, not co-membership or proof of present willingness. The model assigns a base weight of 1/8, below the 1/4 used for actual historical co-membership. This is an editorial weight, not an estimated probability. A sourced current refusal would take precedence over it.

These changes correct the specified connections and a directly related Bennett omission. They do not establish exhaustive coverage of every current commitment, veto or condition. No score is propagated indirectly through a third party to bypass a veto; the model remains one matrix multiplication rather than a feasibility check for an entire coalition.
