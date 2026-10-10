# Refinement integration review — 10 October 2026

Reviewed Claude milestone `0f530ff`, on top of the handoff commit `432bfce`.
This record separates Claude's reported checks from Codex's independent checks.
Everything remains local; this milestone adds no AI calls, paid services,
document parsers or deployment.

## Review outcome

The five-screen workflow, six tasks, seven criteria, editable result, compact
footer and auxiliary About page match the updated brief. No blocking defect was
reproduced in the focused review. Claude's 89-check run remains recorded in
`UX_REFINEMENT_REVIEW.md`; it is not counted as independent Codex verification.

## Shared interfaces integrated

- `WORKFLOW_MODES['local-rules'].notes.analysis` and `.notes.compare` now supply
  each note's `title`, `summary`, `disclosure` and `details`. The UI escapes and
  renders these shared strings. Current public wording is preserved. An unknown
  mode retains a conservative generic note. A future adapter must supply its
  own truthful mode metadata; no AI mode is registered by this change.
- `getPersonalisationFields()` now supplies `inputKind`: `short`, `sentence`
  or `material`. The frontend uses this instead of its own list of short field
  keys. Existing single-line fields and growing/material textareas are preserved.
- Existing workflow tests assert these interface contracts across the six
  branches. No dependencies or new browser modules were introduced.
- The service-worker cache advances from `promptwise-v4` to `promptwise-v5`
  because the shipped app, guidance and workflow modules changed. The approved
  browser-asset list is unchanged.

## Independently verified

Before integration, on Claude's actual app files:

- `npm test`: 31/31 pass. The initial sandboxed invocation could not open the
  loopback test server (EPERM); the permitted local-server run passed.
- `git diff --check`: clean.
- Headless Chromium at 375 px: all six tasks complete the five steps; locked
  steps stay locked; explicit actions unlock later steps; jumping to completed
  steps works; changed original text invalidates later steps; seven criteria
  render; the edited draft survives About and is the text copied.
- Study Support at 320 and 1440 px: grouping and layout checks pass with no
  horizontal overflow. Mobile/desktop screenshots were inspected; the harness's
  full-page capture expands the viewport and can exaggerate whitespace, so it
  is not a measurement of real-device page spacing.
- Each checked screen contains one main region and one site footer. About and
  How it works links work; About is outside the five-step counter. Reduced
  motion removes the entrance animation.
- No online console/runtime errors in this focused browser run.
- Service-worker update: an isolated local copy initially served the actual
  `f3a6acb` v3 assets, then the actual `0f530ff` v4 assets on the same origin.
  Explicit registration update and reload activated v4 and removed the v3
  cache. Offline reload into About, return to fresh Home, local analysis and
  local draft generation all passed. Only the 12 approved shell paths were
  cached; private/docs routes were absent.

After the shared-interface integration:

- `npm test`: 31/31 pass, including the extended interface assertions.
- `node --check src/app.js` and `git diff --check`: pass.
- Rechecked the six mobile flows with both mode summaries and the rendered
  short/sentence/material controls; checked the 320/1440 px study layouts,
  reduced motion, About return, copy and step invalidation again. All passed.
- Repeated the isolated update test from actual `0f530ff` v4 assets to the
  integrated v5 files. The old cache was removed; offline About, analysis and
  draft generation passed.

Scratch harnesses and results are outside the repository at
`/private/tmp/promptwise-refinement-20261010/`. An initial scratch run used
`summary` instead of the actual task id `summarisation`; fixing the harness
allowed the full run to complete. This required no application fix.

## Remaining limits and next work

- Real phones, Safari, Firefox, a real screen reader, home-screen installation
  and the legacy copy fallback remain unverified. These checks establish
  functional behaviour in headless Chromium, not full accessibility compliance
  or student usability results.
- The 8-line growth cap, mobile preference disclosure, 200 ms / 24 px motion,
  explicit-action step gates, hash About route and retained response preferences
  remain adjustable UX choices. None requires blocking this local milestone.
- About copy still lives in `app.js` and `ABOUT_CONTENT.md`. Keep both aligned
  when the team provides profile URLs or the runtime/privacy description changes.
- Cancellation belongs with the forthcoming asynchronous adapter. Its
  integration must also update loading/error messages and About/privacy copy,
  preserve the initial diagnosis, handle stale requests and expose AI failure
  honestly rather than silently returning a local result under an AI label.
- Broader file intake remains the separate `ATTACHMENT_PLAN.md` milestone;
  filenames alone must never count as supplied material. TXT/MD are still the
  only supported formats in this version.
- The report and contract originals were not edited. No student evaluation
  outcomes, supervisor endorsement, API accuracy or grade predictions are inferred.
