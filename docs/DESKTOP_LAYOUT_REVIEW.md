# Desktop layout refinement — 10 October 2026

## Requested changes

These are user-requested usability refinements from five supplied screenshots,
not new report requirements. The five-screen flow and seven criteria remain.

- Prompt Input uses the full content width; the former 860px cap left an uneven
  unused area and shortened the header divider.
- Personalisation's Your prompt disclosure uses the full content width. The
  explanatory introduction keeps a readable text measure.
- Analysis explanations start expanded when analysis completes on desktop and
  collapsed on mobile. Both sizes support individual keyboard-operable toggles
  and Expand/Collapse all. Selections survive re-renders and viewport changes;
  a fresh analysis resets to the appropriate initial view. Narrow desktop
  evaluation panels use one card column rather than squeezing two columns.
- Comparison sections share header/field rows through CSS subgrid on supported
  desktop browsers, so wrapping badges/help text do not offset the field tops.
  The original prompt is not stretched to imitate the length of the rewrite.
  Browsers without subgrid retain the readable independent-column fallback;
  exact alignment in that fallback is not guaranteed or verified.
- Copy Prompt and Improve another prompt share an action group immediately
  below the editable draft. They sit alongside one another when space permits
  and wrap on smaller screens. Restart uses a neutral secondary style; existing
  confirmation for uncopied edits, cancellation focus and copied text remain.
- Corrected the AI no-extra-details message: it no longer claims a rewrite
  preserves the original words. The explanation uses the draft's recorded mode.
- Service-worker cache bumped to promptwise-v10.

## Verification

- npm test: 48/48 passed; node syntax check and git diff --check passed.
- Focused isolated Chromium harness: 61 assertions passed, with no console
  errors. Synthetic data only; two mocked provider calls, zero paid API calls.
- Viewports: 320, 375, 960, 1024 and 1440 CSS pixels. Study Support traversed all
  five screens at each width; the other five tasks reached Compare at 1440px.
- Checked full-width Prompt/Your prompt, initial explanation visibility,
  individual and bulk expansion, matching ARIA state, Enter activation,
  expansion persistence across resizing, edited copy, confirmation focus,
  cancellation preserving edits and restart after copy.
- Field top-edge alignment passed at 960/1024/1440px, for all six desktop tasks,
  a mocked AI rewrite and 200% root text sizing. At 1440px the two actions have
  matching top edges and heights.
- 30 layout states showed no document or inspected-container overflow,
  including Compare/expanded Analysis/collapsed Analysis/Personalisation at
  200% root text size, and Compare at 320px with increased text spacing.
- Nine axe-core 4.14.0 scans detected zero WCAG A/AA violations: desktop Prompt,
  collapsed/expanded Analysis, Personalise, Compare, restart confirmation,
  mobile Compare, and mocked AI Analysis/Compare. Native-control/contrast
  incomplete checks still need manual evaluation; this is not conformance proof.
- Visually reviewed desktop Prompt, Personalisation, expanded/collapsed
  Analysis, Compare and mobile Compare screenshots.

The review used reduced motion to avoid measuring an intermediate entrance
animation. Root text resizing is not actual browser zoom. Safari, Firefox,
VoiceOver, real devices and the outstanding assistive-technology checks in
ACCESSIBILITY_REVIEW.md remain unverified. Scratch harness, screenshots and raw
results are under /private/tmp/promptwise-desktop-20261010/ and are not a durable
repository test suite. No files, examples or documents were sent to OpenAI.

Changes are a local milestone; no push or deployment was performed.
