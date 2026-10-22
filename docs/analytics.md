# Plausible analytics

The site uses the supplied Plausible script (`pa-sQ3MAbMALwg4k9gDtOIWq.js`), without an npm dependency or build step. `index.html` loads `analytics-init.js`, which installs the queue before asynchronously loading Plausible. `analytics.js` sends explicit quiz events.

## What is collected

- One ordinary `pageview` per page load.
- `Quiz Started`: reaching the topic picker.
- `Quiz Completed`: reaching either results screen, including an unanswered quiz or a withdrawn-list notice. This means reaching the end, not necessarily receiving a recommendation.
- `Question Viewed: <id>`: first view of each scored question per attempt.
- `Question Skipped: <id>`: first continuation without an answer for each scored question per attempt.

Question IDs are `dream`, `burden`, `burden-tasks`, `threat`, `bridge`, `weekend`, `emergency`, `draft`, `representation`, `academia`, `women-service`, `sidewalk`, and `child-protection`.

These are separate event names so per-question counts do not depend on custom-property reports. Events contain no additional properties: no answers, selected topics, authority choice, ballot, robot answer, military roster, burden level, result scores or full questionnaire state. Viewed question IDs reveal which questions were visited; this is usage analytics, not anonymous survey-response collection. Plausible's ordinary visit metadata still applies (for example browser, device and referrer).

Views, skips and completions are deduplicated in memory across Back/Forward navigation within an attempt. Starting over resets that deduplication. Reloading starts a new attempt. Conditional paths differ, and revisiting a skipped question can later produce an answer, so event totals alone are not a precise sequential abandonment funnel.

Automatic pageview capture is disabled: selecting answers updates browser history, which must not inflate traffic numbers. Localhost, loopback, private IPv4 LAN addresses and non-HTTP pages do not load the external script or queue events. Public preview deployments are not explicitly excluded. Blocking or failure of Plausible does not prevent use of the quiz.

## Activate in Plausible

1. Deploy the committed changes through the usual Cloudflare Pages deployment.
2. Run Plausible's site installation verification on the deployed site.
3. In the site's **Settings → Goals**, add custom-event goals with the exact names above. Start with `Quiz Started` and `Quiz Completed`, then add whichever per-question goals are useful. Plausible can also offer detected event names when adding goals.
4. Trigger those actions again on the deployed site after creating the goals; earlier events are not backfilled into newly created goals.
5. Check that starts, skips and completion appear in the dashboard. Ad blockers can prevent tracking, so counts will not include every visitor.

Do not change the configuration to capture answers or enable automatic form tracking. No API key is needed in the browser. Custom events count toward Plausible's usage allowance. Built-in funnels are a Business-plan feature; event counts work without that report.

References: [script installation](https://plausible.io/docs/plausible-script), [script configuration update](https://plausible.io/docs/script-update-guide), [custom event goals](https://plausible.io/docs/custom-event-goals), [funnels](https://plausible.io/docs/funnel-analysis).
