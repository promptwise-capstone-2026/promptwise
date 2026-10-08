# Codex frontend integration review

Reviewed on 8 October 2026, starting from Claude's commit `5ba453d` on top of
`a4ca345`. The checkout was clean at the start. Changes and commits remain local.

## Findings resolved

| Finding | Resolution |
| --- | --- |
| Private-file route | Independently reproduced 403 for `/private/references/...` and 200 for `/Private/references/...`, checking status only. Replaced directory blocking with an explicit browser-asset allowlist and a canonical-path check that rejects symlink aliases. |
| Source hints | Missing-source suggestions name relevant code for Coding, a draft or notes for Report Writing, and source material for the remaining tasks. |
| Repeated field guidance | Each intake field has a distinct explanation. Recommended fields drop an Optional placeholder prefix. Current knowledge stays optional because it tailors an explanation rather than supplies essential task context. |
| Level wording | Drafts and diagnosis now say Educational level. Source parsing recognises both the old and new label so a preference line cannot be mistaken for supplied source text. |
| Others closing guidance | Added general guidance to ask for essential missing details and flag claims/references for student verification. It does not invent a custom academic procedure. |
| Placeholder descriptions | Reject exact normalised placeholders including TBD, xxx, none, placeholder and todo. Valid short and multilingual descriptions remain accepted; local checks do not establish academic suitability. |
| Duplicated definitions | Shared modules own preference/detail labels, validation-field stages and order, material descriptors/limit text, mode display metadata and diagnostic fingerprints. The UI consumes these definitions. |
| Service-worker update | Bumped cache to `promptwise-v3`. No new browser module was required; the current asset list already covers the imports. |

The static-server allowlist contains only the current browser assets. When a
future browser module is introduced, update both `PUBLIC_PATHS` in the server and
`ASSETS` in the service worker. Credentials, references, docs, tests and future
API responses are outside the static asset list. Future API handlers need their
own routes before static handling.

Canonical-path checks use Node's `fsPromises.realpath` to resolve symlinks:
[Node file-system documentation](https://nodejs.org/api/fs.html#fspromisesrealpathpath-options).
This is a local development server, not a claim of production hardening against
a process that can modify the project while it runs.

## Independent verification

- `npm test`: **31/31 pass** in the actual checkout. Eight new tests cover HTTP
  browser-asset delivery, private/encoded/case-variant routes, symlink aliases,
  distinct guidance and material contracts, stable fingerprints, source wording,
  level-label source parsing and custom-task guidance. The existing validator
  regression also covers the newly reported placeholders.
- `node --check src/app.js` and `node --check scripts/serve.mjs`: pass.
- `git diff --check`: pass.
- Chromium: all six task branches through the five screens at **320, 375 and
  1440 px** (18 flows). Each returns seven criteria, retains the saved diagnosis
  through personalisation/Back, preserves educational-level selection, and
  copies the student's edited draft. No comparison-screen horizontal overflow
  and no online console errors were observed in these flows.
- Targeted file check: Markdown appends to existing source text, generation stays
  on personalisation while an append/replace choice is unresolved, supplied text
  reaches the draft, and markup remains inert text.
- Targeted required-field check: blank Other format produces an inline error
  and focuses the format description; a supplied description allows generation.
- Cache `promptwise-v3`, offline reload to Home, and offline local analysis pass.
  The first browser script asserted an incorrect Home title after completing
  its 18 online flows. Corrected the harness assertion and reran only the
  remaining offline checks; no app fix was required for that assertion.
- Inspected mobile and desktop comparison screenshots. Browser scripts, sample
  files and screenshots remain outside Git in
  `/private/tmp/promptwise-integration-20261008/`.
- Private-file hashes match the pre-review snapshot; private references remain
  ignored and untracked. No API calls, new dependencies or paid usage were added.

## Remaining work and choices

- API analysis/rewriting, server-side credentials, validated model output,
  cancellation and AI-specific UI wording remain a separate milestone. The
  runtime still truthfully labels local rules and assembled drafts. Async
  requests should throw on failure and never silently claim local output is AI.
- User-requested PDF/Word/image intake remains unimplemented. Current controls
  support TXT/MD only and say so.
- Real phones, Safari/Firefox, a real screen reader, clipboard fallback and
  home-screen installation were not verified in this review.
- Preferences retained across a task change, restart confirmation only for an
  edited uncopied draft, and a single-line Others description remain provisional
  UX choices. No team decision is inferred from this handoff.
- The original report and learning contract remain unchanged, in accordance
  with the user's request to revise them later using implementation evidence.
