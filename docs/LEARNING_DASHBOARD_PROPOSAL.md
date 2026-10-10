# Learning history and dashboard extension

Status, 10 October 2026: the user authorised development of a limited local demo profile, history, recovery and dashboard. The first local milestone is implemented; see [verification and limitations](LEARNING_PRACTICE_REVIEW.md). This is user authorisation to develop an extension, not confirmation that Amara or the team has agreed to amend the assessed scope. Online accounts remain future work.

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

## Minimum useful dashboard

- Recent attempts: task/date, original prompt, saved initial evaluation, AI/local
  mode, generated draft and final student-edited prompt. Keep both draft versions
  so student changes remain visible. Do not generate task answers.
- Patterns: which applicable criteria most often needed clarification, with a
  concrete next tip and a short before/after example.
- Practice over time: show descriptive status counts for comparable attempts,
  with enough context to interpret them. N/A is excluded from applicable counts.
- Optional reflection: “What did you add, and why?” This can provide a useful
  learning activity without a competitive score or ranking.
- First-use/limited-data views encourage trying another task; they do not assign
  failure, red streaks, ability labels or a learning score.

Example wording: “In four of your six Study Support reviews, context could use
more detail. Next time, try adding the subject and what you are preparing for.”

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
