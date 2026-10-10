# Example styling and progress protection — 10 October 2026

## Changes requested by the user

- Distinguish the practice-example panel using a pale yellow surface, ochre
  outline/accent and yellow button, preserving text labels and keyboard focus.
- Restore the red Improve another prompt treatment; its grouped position beside
  Copy Prompt remains.
- Starting another prompt now confirms loss of all current progress, including
  task, prompt, details, material text, evaluation and improved prompt. It does
  not depend on edits or copy status. Stay here preserves work and returns focus;
  Clear progress and start again resets the session and cancels outstanding work.
- Attach beforeunload only while there is meaningful session progress. Cover
  selected task, typed details/preferences, material records, results and pending
  work. Keep protection when About is open and after copying. Remove it on a
  blank/reset session. No interception of normal in-app Back or step navigation.
- The browser owns reload/leave/close confirmation text. Native refresh shortcuts
  use the same lifecycle mechanism; they are not replaced by custom key handlers.
- Footer explains that progress is not currently saved across reloads. There is
  no new autosave, history, dashboard or account system in this milestone.
- Cache bumped to promptwise-v11.

## Verification

npm test: 48/48 passed; node syntax and git diff --check passed.

Focused isolated Chromium checks used synthetic data and disabled AI:

- 25 assertions passed, including native reload cancellation preserving original
  and edited prompt text, accepted reload clearing work, empty Home without a
  warning, task/Others/example protection, About return, copied/unedited/edited
  draft restart confirmations, confirmation focus, cancellation and actual reset.
- Seven native beforeunload dialogs were observed across reload/navigation
  checks. Existing unmodified sample cycling still works without an extra
  replacement confirmation.
- Six axe-core 4.14.0 scans at 320/375/1440px detected zero WCAG A/AA violations:
  Home/example panel and restart-confirmation states at each width. Native select
  contrast incomplete checks still need manual evaluation.
- Six inspected layout states had no detected document/container overflow.
  Visually reviewed the yellow panel at desktop and mobile widths.
- Zero paid provider calls. No private documents or actual user prompts uploaded.

Scratch harness corrections addressed a red hover-state expectation, a
Node/browser variable boundary and an invalid selector. These were test-harness
issues; the final run above completed successfully. Raw evidence is under
/private/tmp/promptwise-progress-20261010/ and is not a durable browser test suite.

## Limits and follow-up

Browser policies require prior user interaction for native unload confirmation.
The message is generic and the event is not reliable for mobile force-close or
process crashes. This protects against normal accidental reloads where supported;
it does not provide recovery. Actual browser-toolbar/Cmd-R/forced-reload variants,
Safari, Firefox and assistive-technology confirmation use remain manual checks.
The dashboard/history extension is proposed separately in
LEARNING_DASHBOARD_PROPOSAL.md; the supplied report currently excludes long-term
history and analytics. Its scope has not been silently changed.

[MDN: beforeunload behaviour and limitations](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
