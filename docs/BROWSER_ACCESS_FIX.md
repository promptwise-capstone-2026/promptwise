# Browser access fix — 11 October 2026

## Report and diagnosis

The project lead reported that macOS Safari and Dia incognito opened the hosted
demo, while normal Dia repeatedly requested credentials and iPhone Safari offered
to download the page. A fresh browser session and one with a saved service worker
are materially different cases.

An isolated HTTPS Chromium test with dummy credentials reproduced the deployed
v22 worker defect: first login succeeded; after completely closing and reopening
the same browser profile, navigation returned a worker-supplied 401 without a
native authentication challenge. This is an app compatibility defect. It does
not mean Render requires the developer's MacBook to remain open.

The server also sent authentication error text without Content-Type while using
nosniff. That is a confirmed response defect and a plausible explanation for the
Safari download behaviour. The actual iPhone behaviour has not been reproduced
or verified by this local test, so the exact Safari cause remains unconfirmed.

## Changes

- Hosted `/sw.js` now serves a small worker without a fetch handler, leaving
  authentication and asset requests on the browser's native network path.
- Activation removes only `promptwise-*` app asset caches. It does not remove
  localStorage, saved History, recovery data or SQLite usage allowances.
- The local development worker uses v23 and retains its existing offline cache.
- Error responses default to `text/plain; charset=utf-8`; HTML/JSON/assets keep
  their explicit content types. No download disposition is added.
- `/demo` is a public, content-free recovery page that updates the existing worker
  registration before opening `/`. `/sw.js` is also reachable without credentials
  so an expired browser authentication session cannot block this migration.
  Both still validate HTTPS and the configured Host. App HTML, browser modules,
  images and APIs remain gated. No account system or paid calls were added.

This is maintenance of the user-authorised hosted pilot. It is not evidence that
Amara approved hosting, authentication or the History extension.

## Verification

- `npm test`: 65/65 pass. New checks cover recovery access, correct MIME types,
  gated app content, Host/HTTPS enforcement and worker cache cleanup.
- Chromium with a real persisted profile, deployed v22 worker and synthetic saved
  History: reproduced the restart failure, then used `/demo` to migrate and log
  in. The original prompt, initial criteria, generated and edited text were kept;
  Resume restored the edited draft. A second full browser restart logged in
  normally and retained the record. Resuming updates its `updatedAt` timestamp.
- All six task workflows at 375 and 1440 px: 55/55 checks pass, including mocked
  AI analysis/rewrite, seven criteria, editing, exact copying, About/History,
  no horizontal overflow and no unexpected browser errors. Twenty-four provider
  responses were simulated; no real key or paid provider request was used.
- Local offline reload, analysis, rewriting, editing and exact system clipboard
  checked separately. Recovery-page update failure checked at 320, 375 and 1440 px:
  no horizontal overflow, a main landmark, live status and visible keyboard focus.
  The 320 px screenshot was visually inspected. No workflow redesign is included.

## Release and manual checks

These are local verification results. They do not mean the fix is deployed.
After the authorised commit is pushed to the Render source repository, deploy
that exact commit using Render's manual deployment when Auto-Deploy is Off.
Keep the existing credentials, disk and usage allowances; do not reset them.

1. In the affected normal Dia profile and iPhone Safari, open
   `https://promptwise-ljw9.onrender.com/demo` once. It updates app files and opens
   the demo. Enter username `demo` and the existing team password when asked.
2. Confirm no download prompt; Home, About and History open normally. Existing
   saved History should remain available in the same browser.
3. Complete a workflow, edit and copy. If saving is enabled, close/reopen the
   browser and confirm login and Resume/History still work.
4. Repeat the root URL in a fresh/private session. Cancelling login must not
   grant access. Never share the API key with testers.

Real iPhone Safari and Dia UI confirmation after release remains pending. Local
Chromium is not a substitute for those device checks. HTTP Basic can still ask
for credentials after a browser session ends; one successful login should open
the app. Hosted offline navigation is intentionally unavailable.

## Primary references

- [Fetch standard: user prompts and service-worker request context](https://fetch.spec.whatwg.org/)
- [WHATWG discussion of browser authentication and service-worker navigation](https://github.com/whatwg/fetch/issues/1132)
