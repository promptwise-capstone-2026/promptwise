# Simple device history review

10 October 2026. The user chose the core app plus simple History on this device,
with the demo-profile and dashboard UI removed. This supersedes the preceding
local learning-profile milestone; it preserves saved records rather than resetting
Git or deleting browser storage. Accounts, authentication, device sync and charts
are deferred. History remains a user-authorised extension; academic scope
confirmation with the team and Amara is still pending.

## Changes

- Home has a compact **Save history on this device** checkbox and History link.
  No Demo learner, account-like profile, My practice page or analytics filters.
  Saving stays off by default; already enabled saving is preserved.
- History is available through Home and every screen's footer. Full settings,
  privacy explanation, export, deletion and saving-off controls live there.
- Saved evaluations reuse Analysis status metadata and CSS: green Present,
  amber Partial, red Missing and grey N/A. Text, icons and keyboard-expandable
  explanations remain, so colour is not the only way to interpret a finding.
  Status badges stay beside labels on narrow screens.
- Original prompts, initial evaluations, generated versions and final edits remain
  separate. Read/copy/reuse/delete and unfinished-prompt recovery still work.
  No background AI request is added. API consent is not restored after refresh.
- Existing v1 data is compatible. The legacy envelope profile field is retained
  internally to avoid a data migration; it is not an account or authentication
  identity. No actual browser data is cleared by this update. Old #practice links
  redirect to #history; direct saved-record links remain valid.
- Dashboard rendering, filters and aggregate calculations were removed. The
  user's future design is recorded in LEARNING_DASHBOARD_PROPOSAL.md: usage over
  time, task distribution and recommendation counts, with week/month/year periods.
- About copy and README now describe simple optional History. Cache is v13.

## Verification

- npm test: 56/56 passed. Previous analytics tests were replaced with a legacy
  record-preservation test; renderer coverage checks status classes and the
  absence of profile/dashboard UI. Existing API mock, six-task workflow, material
  parsing, persistence, storage-failure and server privacy tests remain.
- Isolated Chromium: 24 named checks. A v1-shaped saved record and recovery
  snapshot opened unchanged; its exact edited text recovered and copied. Checked
  seven criteria and all four status styles, keyboard expansion, core flow across
  all six tasks, History return, legacy/direct routes, export containing old data,
  deletion, saving off, quota failure, and correctly labelled mocked AI recovery.
- Eight axe-core 4.14.0 A/AA scans detected zero violations in the tested states:
  Home, list/detail at 320/375/1440 px and a mocked AI history detail. Native-select
  contrast remains an incomplete automated check.
- Eight layout states showed no detected document/container overflow: history
  list/detail at the three widths, desktop at 200% root text and mobile with
  increased text spacing. Mobile and desktop saved-detail screenshots inspected.
- Two synthetic provider calls, zero paid API calls. Only isolated synthetic
  browser data was used. No actual user's saved history was touched by tests.
- One initial harness run waited for Page.loadEventFired during same-document
  hash navigation. Correcting it to wait for the route/element resolved the
  harness timeout; no application defect was involved.
- Node syntax checks and git diff --check passed. No push or publication.

Scratch browser evidence is under /private/tmp/promptwise-history-simple-20261010/;
it is not a durable committed UI test suite.

## Review it locally

1. Reload localhost:4173. Home should have the compact history option and no
   demo-profile or dashboard UI. Existing saved attempts should still be listed.
2. Open History and select a saved prompt. Check coloured statuses, expand an
   explanation with tap or keyboard, and copy the saved edited prompt.
3. Return to prompt. The core five screens should behave as before. Saving off
   keeps the guest flow in memory; saving on also permits refresh recovery.
4. In History settings, export or delete synthetic test entries if desired.
   Remove saved data & turn saving off is destructive and asks for confirmation.

## Limits

History is stored only in this browser and website origin, with a maximum of 50
attempts and 1,800,000 serialized characters. Browser storage is not a guaranteed
backup and does not transfer between devices, ports or hosted domains. Export
has no in-app import path yet. Optional recovery can include accepted material
text; original attachment bytes and pending extraction choices are excluded.
New requests still need the student's AI agreement. Unload warnings cannot
protect against every mobile force-close or process crash.

Real accounts and secure server-side per-user storage would be required for
account-based cross-device history. They are not simulated here. Safari, Firefox,
VoiceOver and real-device/user testing remain pending; automated scans do not
establish formal WCAG conformance. No learning-effectiveness or grade claim is
made by this history feature.
