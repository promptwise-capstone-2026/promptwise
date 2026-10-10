# Learning history and dashboard extension

Status, 10 October 2026: after reviewing the local demo, the user chose the core
app plus simple device-only History. The demo-profile and dashboard UI are
removed; existing history and unfinished-prompt recovery are retained. Accounts,
device sync and analytics are deferred. See [the current milestone](SIMPLE_HISTORY_REVIEW.md).
This is a user-authorised development decision; Amara has not approved an
academic scope change for history or analytics.

## Fit with the supplied report

The report's objectives support understandable feedback, student control and
transferable prompting skills. A reflective dashboard could support that aim.
However, the Project Scope table explicitly excludes “Long-term prompt history,
analytics or institutional administration” for the current stage. Accounts and
persistent analytics should be discussed with the team and Amara, then recorded
as an agreed extension or future work. Internal AI approval does not by itself
approve this extension. Preserve time for evaluation and the final report.

## Recommended sequence

1. Record the user-authorised local feature set and confirm the academic scope change with the team and Amara. Development can continue while that confirmation is pending.
2. Build optional device-only recovery and history first. Accounts are not
   required for persistence in one browser. Explain storage before enabling it;
   include delete-one, clear-all and export controls. Do not promise a backup:
   browser storage can be cleared, unavailable or evicted. Shared-device users
   need a clear way to leave no saved history. A bounded collection is enough
   for a capstone trial. No extra provider request is needed to compute counts.
3. Add a small My practice dashboard from saved, real attempts. Keep the existing
   five-screen workflow, with History/My practice as auxiliary pages like About.
4. Consider cross-device accounts only after the local version has been tested.
   Use managed authentication, a server database, enforced per-user access,
   secure sessions, deletion/export and usage limits. Test that one user cannot
   access another's records. Never put provider keys in browser code.

## Deferred dashboard design requested by the user

A future dashboard should use simple charts and one shared period selector:
**This week**, **This month**, **This year**. It should show:

- Usage over time: reviewed original-prompt attempts per day/week/month as
  appropriate for the selected window. Define usage explicitly; page visits,
  copying, edits and regenerations should not inflate it.
- Task distribution: counts for Study Support, Summarisation, Coding Assistance,
  Report Writing, Presentation Preparation and Others within the selected period.
- Recommended improvements: how often an initial review flagged each of the
  seven criteria as Partial or Missing, for example Context 3 and Output format 5.
  Count a criterion once per original review, not by matching suggestion keywords.
  Do not treat optional tone/depth as missing quality criteria.

Keep the same period across all charts, define calendar boundaries and timezone,
show actual counts and an accessible text/table equivalent, and avoid invented
empty-state data. Label AI and local reviews correctly; mixed review groups must
not imply comparable accuracy. Exclude demonstration examples from personal
patterns. These are descriptive usage/recommendation counts, not a learning score
or proof of improvement. The user has deferred implementation of these charts.

## Data and interpretation rules

- Keep task, time, evaluation mode, model/framework version and criterion
  evidence with each record. Separate local and AI judgements and different
  task types; do not silently compare changed evaluator versions.
- Exclude the bundled practice examples from personal progress by default,
  including edited examples unless the student deliberately marks a real attempt.
- Original evaluations describe the original prompt before Personalisation.
  A generated rewrite is not a new student attempt and is not automatically a
  second evaluated prompt. Do not invent after-rewrite scores or learning gains.
- Repeated Missing/Partial patterns are prompts for reflection, not a measure of
  intelligence or proof of learning. AI judgements are uncertain; fewer missing
  criteria can also reflect a different task or evaluator.
- Minimise retention. Original attachment bytes are never saved. History omits separate material fields, although prompts and rewrites can themselves contain source text. Optional current-session recovery includes accepted material text and explains this before saving is enabled. Unaccepted extracts and pending choices require reattaching. Reusing a history original does not restore its source fields.
- Never save keys, original report/contract files or private reference documents.
  Escape saved text on display and validate any future imported history.
- Browser records belong to a browser profile and origin. Moving from localhost
  to a hosted site will need an explicit export/import path, not an assumption
  that records transfer automatically.

## Suggested division of work

Codex: persistence, recovery, data contracts, aggregate calculations, validation,
access control if accounts are added, integration and focused regression checks.
Claude: history/dashboard layouts, supportive wording and responsive interaction
using the agreed data contract. Coordinate file ownership and commits to avoid
both tools editing the same files at once. Team: learning measures, real test
cases, usability evaluation and agreement on actual contribution records.

## Reference for storage limits

[MDN: browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
