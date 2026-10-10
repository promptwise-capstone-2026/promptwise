# Interface refinement review

Milestone: `docs/UX_REFINEMENT_HANDOFF.md`, built by Claude on top of `432bfce` (app baseline `f3a6acb`).
Readers: Codex, for review and integration, and the team. Everything stays local; nothing was pushed,
published or sent to an AI service.

## What changed

Only `src/app.js`, `src/styles.css` and `sw.js` changed. The shared modules, `scripts/`, the tests and
`private/` are untouched.

| Handoff item | Implemented |
| --- | --- |
| 1. Honest notes | Analysis and Compare each show a one-line local-rules summary that says the app does not use AI. Detailed limits (keyword matching, source presence, nothing sent to an AI service) sit in a "How this review/draft works" disclosure. The pill and tag text come from `WORKFLOW_MODES`. An unknown mode is shown by name only. |
| 2. Attachments | TXT/MD intake, `field.material`, the file-choice guards, escaping and late-read handling are unchanged and now live in a **Materials and requirements** group. `accept` and the supported-format note are unchanged. |
| 3. Required vs recommended | Only the task choice, the Others description, the original prompt and the conditional Other-format description are required. Each shows a red star with "(required)" for screen readers. Other fields are tagged **Recommended · criterion** or **Optional**. Validation errors open the collapsed group that contains the field. |
| 4. Growing fields | The Others description, sentence-length task fields, audience and Other-format description are textareas. They start at 2 rows, grow while typing up to 8 lines, then scroll inside. They resize on render, input, window resize, disclosure opening and file insertion. Ids, data attributes, counters and error mappings are unchanged. Language, target length and duration stay single-line. Material fields are bounded (132–320 px, resizable). |
| 5. Grouping | Personalisation has three groups on one shared section surface: **Task details**, **Materials and requirements**, and **Response preferences — Optional**. In each group, recommended fields come first; optional ones sit in a disclosure with a live "n of m filled" count. Depth and format are fieldsets with legends. On mobile, preferences start collapsed with a "n selected: …" summary; on desktop they stay visible beside the other groups. |
| 6. Transitions | When the screen changes, only the incoming `<main>` animates: a 200 ms, 24 px horizontal slide-and-fade, from the right going forward and from the left going back or returning from About. No outgoing copy is kept, so ids are never duplicated. Turned off under `prefers-reduced-motion: reduce`. Normal page scrolling is unchanged. |
| 7. Step navigation | The five steps are buttons with current, completed and locked states. These are distinguishable without colour: a filled number, a check mark with underlined name, and a dashed outline marked "not available yet" for screen readers. Steps unlock through the actions that lead to them: Continue, a successful analysis, Improve My Prompt, and a created draft. Each unlock is tied to the inputs it used, so a changed task, description or prompt locks the later steps again, live while typing. Clicking a locked step shows a short explanation and announces it. Browser Back and Forward follow the same rules. A completed step adds one history entry. |
| 8. About and footer | A compact site footer on all five screens and on About shows: PromptWise · A student prompt coach · **About & team** · **How it works** · UTS Information Systems Capstone · 2026. It sits in normal flow below the sticky action bar. About is a real page at `#about` (`#how-it-works` jumps to its section). It has no stepper and uses the copy from `ABOUT_CONTENT.md`, including three equal team cards and the supervisor acknowledgement. It returns to the same step with scroll and focus restored, and works with browser Back and Forward. A direct visit returns to a fresh Home. |

Analysis or drafts that finish while About is open are stored without pulling the student out of the page.
Because About uses a hash route, no server allowlist change was needed. The service-worker cache is now
`promptwise-v4`.

## Verification (actual results)

- `npm test`: 31/31 pass. `git diff --check`: clean.
- Browser checks in headless Chromium, using a scripted checklist kept outside the repository: **89/89 pass**.
  One check was a test artefact: the harness scrolled the link into view before clicking, which changed the
  scroll position being measured. It was corrected to record scroll at click time, and the app behaviour was
  confirmed separately. The checks covered:
  - **Six branches at 320, 375 and 1440 px:** all five screens; Step N of 5 on each; seven criteria; every
    personalisation field exactly once, with material fields only in Materials; the edited draft copied to
    the clipboard; restart to Home.
  - **Every screen:** footer present with both links and below the action bar; no horizontal overflow; no
    duplicate ids; no broken ARIA or `label[for]` references; no console errors.
  - **Required fields:** no task, blank Others, empty prompt, and blank Other format (the preference group
    opens and focus moves to the field).
  - **Growing fields:** typed text grows the field with the caret kept at the end and focus kept. Pasted long
    text caps at about 8 lines and scrolls inside, with no horizontal scrolling.
  - **Steps:**
    - Locked Analysis from Prompt shows an explanation.
    - Task can be reached directly from Personalise, with a backward transition and exactly one new history
      entry; Personalise returns with values and the file text kept.
    - A detail change leaves Compare reachable, marked stale, with the edited draft kept.
    - A prompt change locks Analysis, Personalise and Compare while typing.
    - Rapid step clicks leave a single `<main>` on the correct screen.
  - **About:**
    - The footer link opens About (no stepper, URL `#about`, focus on the heading).
    - How it works focuses its section.
    - Return to prompt restores Compare with the edited draft and scroll position.
    - Browser Back and Forward between Compare and About work.
    - A pending analysis or draft does not pull the student out of About, and its result is available on
      return.
    - A direct load of `/#how-it-works` focuses the section, and Return goes to a fresh Home.
  - **Motion:** forward and backward entrance classes are applied; the keyframes use `translateX` only; the
    animation is `none` under emulated reduced motion.
  - **Keyboard:** Tab reaches the step buttons and both footer links; Enter on About & team opens About.
- Screenshots of Home, Analysis, Personalise, Compare and About at 320, 375 and 1440 px were reviewed by eye.
  One defect was found and fixed: step names broke mid-word in narrow columns.
- The server still returns 403 for `/private/...` (including the case variant) and `/docs/...`. `private/`
  remains ignored.

## Remaining limits

- Not re-verified in this pass: offline use and service-worker update behaviour (the cache name and asset
  list were bumped only). Not verified at all: real phones, Safari and Firefox, a real screen reader, the
  `execCommand` copy fallback, and home-screen installation.
- Visual judgement comes from screenshots only; no usability testing with students was done.
- Provisional UI choices for the team:
  - 8-line growth limit
  - preferences collapsed on mobile
  - 200 ms / 24 px motion
  - step unlock rules based on explicit actions
  - About as a hash route
  - preferences kept across a task change

## For Codex

- **Mode copy.** `WORKFLOW_MODES` gives only `pill` and `tag`. The local-rules summary and detail sentences
  live in `modeNote()` in `app.js`. A future AI mode needs its own summary and limits, for example
  `WORKFLOW_MODES[mode].summary` and `.details`, so the UI can show them without hard-coding AI wording.
- **Field kind.** The UI keeps `SHORT_FIELDS` (`language`, `targetLength`, `duration`) to decide single-line
  inputs versus growing textareas. A shared `field.inputKind` (`short` / `sentence` / `material`) from
  `guidance.js` would remove this.
- **About content.** The page copy is a static copy of `docs/ABOUT_CONTENT.md` inside `app.js`. Update both if
  the text, team links or version note change. Show profile links only once approved URLs exist.
- **Future routes and modules.** If About moves to a real path (for example `/about`) or into its own module,
  add it to `PUBLIC_PATHS` in `scripts/serve.mjs` and to `ASSETS` in `sw.js`, and bump the cache.
- **Async adapter.** Pending results are already ignored or stored quietly when the student moves away or
  opens About. `AbortSignal` support in `analyseWorkflow`/`improveWorkflow` would allow cancellation instead.
- **Attachments.** The broader formats in `ATTACHMENT_PLAN.md` can extend `field.material`. The Materials
  group renders whatever descriptors are supplied, but `accept` and the format note must change together with
  real parser support.
