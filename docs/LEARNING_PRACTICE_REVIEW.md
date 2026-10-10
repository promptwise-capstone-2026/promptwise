# Local learning profile milestone review

10 October 2026. Implemented a single local demo profile with optional history,
session recovery and a supportive learning dashboard. The five-screen workflow
remains the main flow; My practice and History are auxiliary pages.

## Scope and authorisation

The user authorised this extension and requested a one-profile semester demo,
with online accounts deferred. The supplied report's Project Scope table still
excludes long-term prompt history, analytics and institutional administration.
This milestone is an additional user-authorised feature. It does not establish
team or supervisor approval to change the assessed scope. Amara's conditional
support for internal AI analysis/rewriting is not approval of this extension.
Private source documents and the learning contract were not changed.

## Implemented behaviour

- Home labels **Demo learner** as a local browser profile. Remember my work is
  off by default. No account, authentication, cloud database or device sync.
- Successful analysis saves the original prompt and its initial seven-criteria
  evaluation. An evaluation-only attempt is useful even before a rewrite exists.
- Generated and last student-edited prompt versions are separate. Edits and
  regenerations update the same attempt rather than inflating the timeline.
  Changing the original and analysing it creates another attempt. A mode switch
  keeps the previous review and starts a separate record in the new mode.
- History supports reading evaluation explanations, copying the final saved
  text, reusing the original as a new attempt and deleting an attempt. Reuse
  restores the original/custom task, not its source fields or preferences, and
  does not automatically analyse it.
- My practice provides a next tip, seven criterion patterns and an original-
  attempt timeline. It separates task, mode, model and framework version;
  bundled examples, including edited/reused examples, stay excluded. N/A is
  excluded from applicable counts. There is no learning score or ability label,
  and counts are explicitly not proof of learning. Rewrites are not separately
  evaluated, and no before/after quality gain is invented.
- Saving updates after typing and on app transitions/visibility changes. Refresh
  offers explicit Resume saved work or Start fresh on Home. Recovery restores
  validated text, result modes, the available workflow step and the edited draft
  without starting an API request. API consent is never restored.
- Restart confirms before closing work and retains saved history. Native unload
  protection remains for unsaved/failed saves and pending requests/file work.
  Successfully saved text can reload into the recovery offer.
- Export saved work downloads JSON. Delete-one and Remove saved data & turn
  saving off require confirmation. An open deleted attempt stays usable but is
  suppressed from saving until a new attempt starts; it is not silently recreated.

## Storage, privacy and integrity

`src/practice.js` owns the versioned data schema, storage operations and pattern
calculations. `src/practice-view.js` renders escaped saved text and learning
views. `src/app.js` coordinates lifecycle, consent, routes and workflow state.
There are no new dependencies. Both browser modules are explicitly allowlisted
by the local server and cached with the app shell under `promptwise-v12`.

Storage uses one localStorage key, `promptwise.practice.v1`, for one profile and
website origin. The limit is 50 attempts and 1,800,000 serialized characters,
including the recovery snapshot. Actual browser quotas may be smaller. Limits
are implementation choices, not requirements from the report. Failed writes
retain the last successful data and show an error; older entries are not silently
evicted. Schema, identifiers, text limits, seven statuses and original/evaluation/
draft associations are validated. Damaged or unknown-version data is not
silently overwritten. Observed cross-tab conflicts pause or refuse saves;
localStorage is not a transactional multi-user database.

Optional recovery includes accepted material text and preferences. Original file
bytes, unaccepted extraction previews and pending file choices are excluded.
History omits separate material fields, but originals and rewrites may themselves
contain source text. The privacy notice explains these distinctions before
saving is enabled, and exports may contain accepted source text from the current
session. A restored session says that attachment objects and pending choices
need reattaching. No key, consent flag or file object is saved by the schema.
Export filenames are ignored by Git and the server allowlist does not serve them.
Saving off is the choice for shared devices. Browser-local storage is not an
encrypted private account, a guaranteed backup or a cross-device service.

## Verification

- `npm test`: 56/56 passed, including eight new persistence/metrics/rendering
  tests. Coverage includes opt-in/upserts, generated versus edited text,
  recovery validation and unknown-field exclusion, quota/permission failures,
  damaged data, capacity/deletion, example and cohort separation, escaping and
  stale writers. Existing workflow, material, API mock and server privacy tests
  also passed. Node syntax checks and `git diff --check` passed.
- Isolated headless Chromium: 42 named checks across the main and supplementary
  runs. All six tasks completed the five screens. Checked evaluation-only saves,
  edited-draft upserts, exact recovery, accepted material/Other-format recovery,
  history copying/deletion/reuse, restart preservation, example exclusion,
  AI/local mode separation, renewed AI consent, JSON export and offline shell.
- Failure checks: injected quota failure preserved the last successful saved
  data while editing/copy worked; retry recovered; simulated another-tab change
  paused saving; a blocked localStorage getter still allowed a full guest flow.
  A separate guest flow completed with no saved profile.
- Accessibility: 14 axe-core 4.14.0 WCAG A/AA scans detected zero violations in
  the tested states. Keyboard checks covered enabling saving, dashboard filters,
  history navigation, saved criterion expansion and copying. Reduced motion
  removed entrance animation. Native-select contrast checks remained incomplete.
- Layout: 21 inspected states had no detected document/container overflow.
  Dashboard/history/detail widths included 320, 375, 960 and 1440 px; supplementary
  checks covered 200% root text at desktop and increased text spacing at 320 px.
  Desktop/mobile dashboard and desktop saved-detail screenshots were inspected.
- The clipboard assertion failure was a harness error: `readClipboard().last`
  is a string, not an object with `.text`. The corrected check compares the exact
  string with the saved textarea. A separate code-review finding about mode
  switches overwriting the old review was fixed and reproduced successfully.
- Only two synthetic provider calls occurred in the main browser run. Zero paid
  API calls; no private references or real user text were used in browser tests.
  The running localhost app serves both new modules and cache v12.

Browser harnesses and raw evidence are scratch artifacts under
`/private/tmp/promptwise-practice-20261010/`, not a durable committed UI suite.
The automated library tests are committed under `tests/practice.test.mjs`.

## Manual review steps

1. Reload `http://127.0.0.1:4173`. Read the local-profile notice and enable
   Remember my work on this device. Use a non-sensitive prompt of your own.
2. Select Study Support and enter `Explain phishing.` Analyse it. Open History:
   the original and seven evaluation statuses should be available before rewriting.
3. Return to prompt, personalise it and create an improved prompt. Edit the
   result, then check History: the final edit and generated version should differ.
4. Refresh. Select Resume saved work on Home; check the edited text and supplied
   details. New AI actions require agreeing again on Task; recovery itself is free.
5. Start another prompt and submit your own more specific Study Support prompt.
   Open My practice, choose the matching task/review group and review the timeline.
   Different modes/models/versions should not be merged.
6. Run Try an example through the flow. It should appear as an Example in History
   without increasing personal dashboard counts.
7. Export saved work and inspect the JSON privately. Delete one saved attempt;
   confirm other entries remain. Remove all saved data and confirm saving is off.
8. Try a guest flow with saving off. Edit/copy should work; leaving/reloading with
   progress should trigger the browser's warning where supported.

## Remaining work and claims to avoid

- Authentication, multiple users, durable server storage, authorisation and
  cross-device sync are deferred. Do not present this profile as a secure account.
- JSON import/migration is not implemented. A new hostname, port, browser profile
  or hosted site has different storage. Export does not currently provide an
  in-app restore path. Browser data may be cleared or evicted.
- Original attachment objects, pending extracts, temporary errors, expansion
  choices and exact scroll/focus positions across refresh are not restored. An
  in-flight AI request is not resumed; interrupted work must be requested again.
- Native unload warnings depend on browser policies/user interaction and cannot
  guarantee protection from mobile force-close, a crash or power loss. Browser
  saving is synchronous and bounded; real-device performance remains unmeasured.
- Safari, Firefox, real phones, VoiceOver and disabled-user evaluation remain
  outstanding. Automated scans, root text resizing and spacing checks are not a
  formal WCAG conformance audit or actual browser-zoom/device certification.
- Learning effectiveness, model accuracy and usability need independent student
  evaluation. Descriptive dashboard patterns alone do not establish improved
  prompting skill. No grade or competitive advantage is guaranteed.
- Future evaluator changes must update the framework version so incompatible
  reviews are not compared. Future authentication must use real access controls;
  hiding a sign-in interface is not security.
- No push, publication, domain purchase or paid API request was made for this
  milestone. The original capstone workflow remains the priority.
