# Frontend consistency and functional review — 10 October 2026

Reviewer: Claude (frontend). Baseline `b1d078c`, clean working tree. This was one focused pass with targeted
re-checks. It is not a WCAG conformance audit. No paid API calls were made, and nothing was pushed or
published. Private references were read for context only.

## Requirement sources

| Source | What it establishes here |
| --- | --- |
| Original report and learning contract | Five stages; seven task-aware criteria with Present/Partial/Missing/N/A; editable, copyable improved prompt; before/after comparison; responsible-use reminder. Tone and depth are optional. |
| Later user-authorised changes | Others description on Home; grouped Personalisation; growing fields; clickable steps; About & team; site footer; PDF/DOCX/PPTX/TXT/MD intake; optional local OpenAI mode; practice examples with yellow emphasis; red restart action; progress protection; optional device-only History. **History is user-authorised. It is not approved by Amara, and academic scope confirmation is still pending.** |
| This review | Fixes listed below and the optional recommendations. None changes scope. |

## Coverage

**Pages and states**

- Home: empty, Others error, example loaded, saving on, mocked OpenAI mode.
- Prompt Input.
- Analysis: collapsed, expanded, mocked AI.
- Personalisation for all six tasks, including a pending DOCX preview.
- Compare: local and mocked AI, plus the restart confirmation.
- History: list and saved detail.
- About & team.

**Widths**

- 320, 375, 768 and 1440 px.
- Footer at 940, 959, 960 and 980 px.

**Automated per-state checks:** 81 captured states, checked for horizontal overflow, duplicate ids, broken
`aria-*`/`label[for]` references, clipped content and small targets. axe-core 4.14.0 ran on 28 states
(WCAG 2.0–2.2 A/AA tags) at 375 and 1440 px.

**Functional checks** (56 scripted assertions plus targeted re-checks):

- **Workflow:** all six tasks, each copying the exact edited text (including trailing spaces and symbols) to
  the clipboard.
- **Validation and navigation:** task/Others validation, including a multilingual description; locked-step
  hints; values kept through step and browser navigation; stale steps re-locked after a prompt change.
- **Files:** DOCX preview, edit and use; PPTX append in slide order; PDF extraction; blank PDF, PNG and
  oversized-TXT errors that keep existing text; escaped file names and content.
- **Mocked AI:** consent required, loading, failure, retry and labels. A late rewrite does not pull the user
  out of History.
- **Recovery and History:**
  - refresh recovery
  - History keeps original, generated and edited text separately
  - copy saved prompt, JSON export, delete, and clear-and-turn-off
  - native confirmations for destructive actions
- **Robustness:** unavailable `localStorage` and quota failure, with the core workflow still completing;
  examples labelled in History; native unload warning (cancel keeps work, empty session has no warning).
- **Keyboard, focus and reflow:**
  - skip link first; visible focus; focus moves to the heading after navigation; restart confirmation focus
  - reduced motion
  - 200% root text and WCAG text-spacing overrides at 320 and 1440 px

**AI test safety:** AI states used responses mocked in the browser through Chrome DevTools Protocol
interception, never reaching the local API or a provider. The local server ran without `.env`, so it reported
AI unavailable.

## Results before fixes

- No overflow, duplicate ids, broken references or axe violations in any tested state. No console errors.
- Footer note: on its own left-aligned line below 960 px (left edge 32 px at 940/959) and right-aligned on the
  brand row from 960 px.
- Two scripted failures were test artefacts, then re-verified by other means:
  - Tab leaving the page reported `body` as a focus stop.
  - `Page.reload` bypasses `beforeunload`. A page-initiated reload did show the warning, cancelling kept the
    work, and an empty session showed no warning.

## Confirmed defects fixed

| # | Defect | Fix | Files |
| --- | --- | --- | --- |
| 1 | Editing the prompt while an analysis was pending left **Analyse Prompt** with `aria-disabled="true"`, so it was announced as unavailable and looked faded, although it worked (reproduced with a delayed mocked AI response). | Clear `aria-disabled` when the stale request is cancelled. | `src/app.js` |
| 2 | Home's History link, History's All attempts link and the OpenAI data-controls link used the browser's default blue; all other links are ink. | Global ink link colour with the existing underline offset. The skip link keeps its white-on-ink style. | `src/styles.css` |
| 3 | History had a bare brand line and a secondary Return button, unlike About's header with a back control. | Same header and **‹ Return to prompt** control as About; the duplicate in-page button was removed. | `src/practice-view.js` |
| 4 | History disclosures differed from Analysis: normal-weight criterion names, chevron on the left, and a native triangle on "Generated draft before your edits". | Bold names, chevron after the status badge (down closed, up open), shared chevron for the draft disclosure. Status colours, icons and words unchanged. | `src/styles.css` |
| 5 | In OpenAI mode the Review-mode panel was cramped and its consent checkbox was 18 px. | Grid spacing; consent row matches the History checkbox (22 px box, 44 px row). | `src/styles.css` |
| 6 | "1 saved attempts". | Singular/plural wording. | `src/practice-view.js` |

Service-worker cache bumped to `promptwise-v15`. Each fix was re-checked:

- **History list and detail at 320, 375 and 1440 px:** no overflow, no broken references, zero axe violations.
- **History controls:** the top Return reaches Compare with the edited draft intact. From the History heading,
  Shift+Tab reaches Return and Enter activates it.
- **Links:** every non-skip link computes to ink.
- **AI panel:** zero axe violations.
- **Analyse button:** editing during a pending analysis now leaves no `aria-disabled`, and re-analysis uses
  the edited prompt.

`npm test` passes 56/56; `git diff --check` is clean.

## Issues for Codex (shared logic — not edited)

1. **Lowercase placeholders.** `src/guidance.js` strips a leading `Optional:` from recommended placeholders
   without re-capitalising. Report Writing shows "supply the material the report should draw on." and "paste
   your own draft or notes." To reproduce: Report Writing with "Help me plan a report on cyber safety.", then
   Analyse and Improve My Prompt.

No backend, API or storage defect was reproduced in this pass. Storage failures, quota limits and late async
results behaved as documented.

## Visual assessment and optional recommendations

**What works well:**

- one restrained token set
- clear black primary actions with green Copy and red restart
- status shown by word, icon and colour, identically in Analysis and History
- a visible yellow example panel
- readable step navigation
- consistent section surfaces
- a footer that stays out of the sticky action bar

**Three optional improvements** (user choice; not implemented):

1. **Shorter mobile Personalisation.** At 320 px a source-dependent Study page is about 5,000 px tall, partly
   because every material field repeats a long file note. One shared note per Materials group, plus a short
   per-field purpose line, would cut scrolling and repeated reading.
2. **Task choice higher on mobile Home.** Review mode (when AI is available), the History option, the example
   panel and the required note all come before the task cards. Moving the History option below the tasks or
   into the footer/History page would bring the first required decision into view sooner.
3. **More scannable History list.** Every card carries a "Your attempt" tag. Showing a tag only for Examples,
   and optionally a short status summary such as "2 missing", would make the list easier to scan without
   adding a dashboard.

Smaller preference: on desktop Compare, a short original prompt leaves a large empty box beside the improved
prompt; a smaller minimum height would look tidier.

## Limitations

- Headless Chromium on macOS only: no Safari, Firefox, real phones or tablets.
- No VoiceOver or other screen reader; axe and accessibility-tree checks do not establish conformance.
- Root-font resizing approximates, but is not the same as, browser zoom at 200%/400%.
- Files were set through DevTools, not the native picker. Export was intercepted at blob creation, not saved
  through a download dialog.
- The clipboard `execCommand` fallback, home-screen installation, forced colours and live OpenAI responses
  were not verified.
- Scratch scripts and screenshots are outside the repository and are not a durable UI test suite.
