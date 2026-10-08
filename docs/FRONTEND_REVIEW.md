# Frontend milestone review

Scope: the frontend milestone in `docs/FRONTEND_HANDOFF.md`, implemented by Claude on top of `a4ca345`.
Readers: Codex, for review and integration, and the team. All work is local; nothing was pushed or published.

## What changed

Only frontend-owned files changed: `src/app.js`, `src/styles.css`, `index.html` and `sw.js`.
Shared modules (`tasks`, `rules`, `validation`, `guidance`, `workflow`, `materials`), `scripts/` and the
existing tests are untouched. The private references were read only and remain ignored by Git.

| Area | Implemented |
| --- | --- |
| Workflow | Five screens and all six branches are preserved. Input survives Back, browser history and re-renders. Typing never re-renders a focused field. History entries carry a session id, so entries from a reload or restart are skipped rather than reopened. |
| Visuals | Tokens for colour, type, surfaces and status. System fonts only, no dependencies. Mobile first, with a two-column desktop layout at 960 px and above for analysis and comparison. Visible focus ring and touch targets of at least 44 px. |
| Home | Six radio cards. Others reveals a labelled description stored in `details.taskDescription`. `validateInput(..., { stage: 'task' })` runs before Continue. The `CUSTOM_TASK_MAX_LENGTH` counter does not truncate text. Validator warnings appear live as guidance. Errors keep the entered text. Switching task after entering details asks for confirmation; the prompt and response preferences are kept. |
| Required fields | A red asterisk with "(required)" for screen readers marks the task choice, the Others description, the original prompt and the conditional Other-format description. The asterisk is explained on screen. Criteria and preferences are never marked required. |
| Analysis | Calls `analyseWorkflow` once per prompt/task/description and saves the result. Personalisation cannot replace it. A changed prompt or task invalidates it. Stale and late results are ignored and never move the user to another screen. Mobile shows seven compact expandable cards (button, `aria-expanded`). Desktop shows full explanations. A local-rules note states the limits of keyword checks and of source detection. There is no score and no Tone or Depth row. |
| Personalisation | Built from `analysis.fields`: recommended fields first, optional fields in a disclosure with a live "n of m filled" count. The Others description is not asked again. Values kept for fields that the current analysis no longer shows are listed rather than silently dropped. Level options come from `LEVELS`; audience is a separate free-text field; nothing is preselected. |
| Text files | Available on `source`, `code`, `draft` and `criteria`, using `readTextMaterial` and `TEXT_MATERIAL_ACCEPT`. The UI shows reading state, Cancel reading, filename and size, Replace / Add below / Cancel when the field already has text, Remove file text (which restores an earlier file's record), Dismiss for errors, and escaped names and content. Late reads after a task change, restart or new pick are ignored. Create is held, with an explanation, while a visible field is reading or awaiting a choice. PDF, Word and image files are not offered. |
| Comparison | `improveWorkflow` runs behind loading, error and retry states. The draft is labelled from `draft.mode` ("Local rules", "Locally assembled draft", "It is not an AI rewrite"). The prompt is editable. Copy uses the edited text and rejects empty text. The screen shows source warnings, the responsible-use reminder, a "What this draft includes" list built from the draft's own input, a stale-draft notice, and confirmation before edits are replaced or discarded. |
| Service worker | `promptwise-v2` lists every imported module. It is network first, so a refresh shows the current version, with the cache as an offline fallback (query strings included). Only the listed shell paths are cached; `private/` and any future API path are never cached. |

## Labelling and AI status

The running app uses local rules only. Every result screen says so, and nothing claims AI output or semantic
judgement. `a4ca345` records Amara's conditional support for internal OpenAI analysis and rewriting. The
request for this milestone described it as still pending. Either way, this milestone adds no API calls.
`MODE_LABELS` in `app.js` is ready for a new mode. An unknown mode is displayed by name and never as local or AI
output.

## Verification

- `npm test`: 23/23 pass.
- Browser checks used headless Chromium over CDP with a dependency-free harness outside the repository. Each
  round had independent testers plus a separate verifier per finding, who reproduced the finding and tried to
  refute it:

| Round | Scope | Result |
| --- | --- | --- |
| 1 | Eight areas: home, analysis, personalisation, files, comparison, layout/a11y/SW, code review, six branches | 54 findings, 50 confirmed (6 in shared code); frontend items fixed |
| 2 | Re-test of the round-1 fixes, regression, review of the new code | 35 fixed, 11 partly fixed, 1 not fixed; 23 new findings, all confirmed and fixed |
| 3 | Re-test of round 2, full regression, code review | 42 fixed, 1 partly fixed; 8 new findings (6 distinct), all fixed and re-checked with targeted scripts |

- Final run on the committed state: all six branches went through all five screens at 375×812 and 1440×900
  (7 criteria, edited text copied, restart to Home). There was no horizontal overflow and there were no
  console errors. The service-worker cache `promptwise-v2` holds 12 assets.
- Round 3 also covered 320×640. It found no overflow, duplicate ids or broken ARIA references in 245 screen
  states. Status text, muted text, placeholders and control borders meet WCAG AA contrast. A keyboard-only run
  of the flow worked.
- Simulated slow and failing `analyseWorkflow`, `improveWorkflow` and file reads were used to test stale-result
  guards, busy states, error and retry paths, and late file reads.

Not verified: real devices; Safari and Firefox; a real screen reader (the accessibility tree was inspected
instead); the `execCommand` copy fallback; installation as a home-screen app.

## Issues for Codex

### Shared logic

1. `rules.js`: the source suggestion "Add the source, code, or draft…" appears in Summarisation and Study
   warnings. Task-specific wording would read better.
2. `guidance.js`: some recommended fields repeat the same criterion guidance. For example, "What do you already
   know?" maps to context, and its placeholder begins "Optional:" while it is shown as recommended.
3. `rules.js`: the draft line says "Learning level" while the field is "Educational level". Please agree one
   term.
4. `rules.js`: the Others draft has no closing guidance or verification line; the other five branches do.
   Please confirm whether that is intended.
5. `validation.js`: "TBD", "xxx", "none", "placeholder" and "todo" pass as Others descriptions with only a
   warning.
6. `scripts/serve.mjs`: the `private/` block is case-sensitive. On this case-insensitive disk,
   `/Private/references/…` returns 200 (re-checked for this review). The server is local only, but the reference
   files are exposed to local processes.

### Interface needs

The UI currently keeps the following itself; each will drift if shared definitions change.

- **File-capable fields:** the list (`FILE_FIELDS`) and its purpose text. Field descriptors could carry
  `material: { accept, purpose }` instead.
- **Error placement:** which screen and field each validation key belongs to (`errorScreen`, `FIELD_ORDER`). A
  stage or field order from `validateInput` would remove this.
- **Labels:** display labels for preferences and for detail keys absent from `analysis.fields`
  (`PREFERENCE_LABELS`, `fieldLabel`).
- **Freshness check:** the analysis cache key (`analysisKeyOf`). An input fingerprint echoed in results would
  let the UI check freshness directly.
- **Mode names:** display metadata for result modes (`MODE_LABELS`).
- **Limit text:** the "1 MB" wording, which mirrors `TEXT_MATERIAL_MAX_BYTES`.

### When the AI adapter arrives

- **Async boundary:** the UI already awaits both workflow functions and guards against stale results.
  `AbortSignal` support would allow requests to be cancelled instead of ignored.
- **Mode and failure:** return a distinct `mode` and add its label to `MODE_LABELS`. Make failures throw, so the
  UI shows its error and retry state. Never return local output under an AI mode.
- **Service worker:** add any new module to `ASSETS` in `sw.js` and bump `CACHE`. Keep API routes out of the
  cached list.

### Decisions for the team

- Response preferences are kept when the task changes; task details, files and the draft are cleared after
  confirmation.
- "Improve another prompt" asks for confirmation only when the draft was edited and not copied.
- The Others description is a single-line input (240-character prototype limit).
- Browser Forward onto an entry from an earlier session does nothing visible; the next Back steps over it.

## Tests

No browser tests were added to the repository, because test ownership sits with Codex. The CDP harness and
scripts used here could be adapted into dependency-free UI tests if the team wants them in `tests/`.
