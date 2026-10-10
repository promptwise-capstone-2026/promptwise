# Accessibility review — 10 October 2026

## Status and scope

Target: **WCAG 2.2 Level AA**. This is a scoped engineering review, not a full
conformance assessment, certification or accessibility guarantee. It does not
establish that the app meets every disabled user's needs. Baseline: `ed45caa`,
with the team-credit and accessibility changes described below.

Reviewed the five-step workflow and auxiliary About page in headless Chromium
on macOS. No API credits used; the AI-labelled states used synthetic provider
responses. Nothing was uploaded or deployed by this review.

## Evidence

| Check | Result and scope |
| --- | --- |
| Automated WCAG checks | axe-core 4.14.0, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`: **33 states, zero detected violations** at 375 and 1440 CSS px. |
| States covered | Home, missing-task errors, loaded example, Prompt, Analysis, expanded mobile criterion, Study Personalise, Other-format errors, Compare, copy confirmation, About, expanded Personalise for the other five tasks, and desktop AI Analysis/Compare fixtures. |
| Keyboard workflow | Tab/Enter navigation completed all five screens from a loaded example; expanded feedback; edited and copied the draft; About returned to the edited draft. Sample selection was random, not every task tested by keyboard. |
| Skip and focus | Skip link is the first keyboard stop and focuses the main landmark. Missing-task validation focuses the labelled invalid control with its error description. Screen changes focus the title. Traversed keyboard targets were not off-screen or covered by the mobile action bar. |
| Reflow | Home, Analysis, Personalise, Compare and About at 320 and 1440 CSS px: no detected document or inspected-container overflow after fixes. |
| Enlarged text | Home, Personalise, Compare and About at 1440 px with root text size set to 200%: no inspected-container overflow after fixes. This is a text-resizing check, not real browser zoom. |
| Text spacing | Home and expanded Personalise at 320 px: line height 1.5, letter spacing .12em, word spacing .16em and paragraph spacing 2em; no inspected-container overflow after fixes. |
| Reduced motion | Entrance animation computed as `none` with `prefers-reduced-motion: reduce`. Stable automated scans used this setting to avoid sampling transient entrance opacity. |
| Regression checks | `npm test`: **48/48 pass**. `git diff --check`: clean. These are functional checks, not WCAG-conformance tests. |

The layout checks above comprise 16 measured states. Measurements inspected the
header, main, navigation, step list, task/team cards, field headings, summaries,
form groups and file buttons. No overflow measurement alone proves that every
piece of content is readable or all controls work with assistive technology.

### Contrast review

Axe returned contrast items requiring review for native selects and decorative
check/status glyphs. Calculations using the current CSS colour tokens gave:

| Pair | Contrast ratio |
| --- | ---: |
| Select text / white field | 18.58:1 |
| Muted guidance / soft surface | 5.82:1 |
| Completed step and Present text / pale green | 6.32:1 |
| Partial text / pale amber | 7.53:1 |
| Missing text / pale red | 6.54:1 |
| N/A text / pale grey | 7.29:1 |
| White status glyphs / their solid backgrounds | 7.01–8.30:1 |
| Blue focus outline / white | 6.32:1 |

These sampled text pairs exceed the normal-text AA threshold of 4.5:1. This
calculation does not test every hover, OS popup, native-control rendering,
border or forced-colours state. Statuses also use explicit words, not colour
alone. Native popup rendering still needs review in actual browsers.

## Changes made

- Added a visible-on-focus **Skip to main content** link to bypass repeated
  header/navigation controls. It focuses main without changing the app route.
- Fixed the mobile preference summary: selected values previously stayed on one
  unbroken line and could be clipped. The summary now wraps onto its own line.
- Allowed the progress steps to wrap when larger text needs more space.
- Fixed task-card grid sizing so increased text spacing cannot push a long task
  title beyond its card. Long hint words can wrap when necessary.
- Added structured team-role headings and current responsibility copy.
- Bumped the offline cache to `promptwise-v9`.

The contrast warnings from the first exploratory run during entrance animation
were harness timing artifacts; stable scans did not reproduce them. The three
layout overflows above were reproducible and fixed.

## Remaining checks before a conformance claim

- VoiceOver with Safari, and at least one other screen-reader/browser pairing:
  actual spoken names, headings, criterion expansion, errors, loading/status
  announcements, document actions, edited copy and About return.
- Real browser zoom at 200% and 400%, native dropdowns/file pickers, forced
  colours/high-contrast settings and portrait/landscape on real devices.
- Pending and failed file extraction, replace/append/cancel, loading/cancellation,
  provider refusal, timeouts and retry with assistive technology. Functional
  tests cover some of these, but that is not assistive-technology verification.
- Keyboard traversal of every task branch and all error/confirmation states,
  persistent focus visibility under ordinary motion, and text-spacing/resize
  checks on the remaining states.
- Review with disabled users where feasible; record their needs, observations
  and any unresolved barriers. Do not infer usability from an automated score.
- Recheck after the requested desktop layout changes and after adding portraits.
  Use supplied portraits with meaningful alternatives where informative; a
  portrait duplicating the adjacent name can use empty alt text.

No WCAG badge or full-compliance claim has been added. Appropriate presentation
wording at this stage is:

> We targeted WCAG 2.2 AA and checked automated accessibility, keyboard navigation,
> reflow and text resizing. We fixed the barriers found; screen-reader and broader
> assistive-technology evaluation remain planned.

## Reproducing the review

Start the app locally and use axe-core 4.14.0 with the tags above on each listed
state after motion settles (or with reduced motion enabled). Use synthetic data
and a simulated provider for AI states. Follow the keyboard journey and apply
the explicit viewport/text settings listed above. Record violations, incomplete
checks, focus behaviour and clipped content separately. Scratch harnesses and
raw evidence for this run are under `/private/tmp/promptwise-a11y-20261010/`;
they are not a durable repository test suite.

## Sources

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C evaluation tools overview](https://www.w3.org/WAI/test-evaluate/tools/)
- [W3C conformance evaluation](https://www.w3.org/WAI/test-evaluate/conformance/)
- [axe-core documentation and limits](https://github.com/dequelabs/axe-core)
