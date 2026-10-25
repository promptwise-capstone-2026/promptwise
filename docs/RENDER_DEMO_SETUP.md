# Render demo setup

Prepared 10 October 2026; public-access configuration updated 25 October 2026.
This is a capstone demo, not production student accounts or a promise of
public-service security. Hosting is a release
choice requested by Thai. History remains the user-authorised extension; do not
claim Amara approved history, authentication, dashboards or deployment. Her
conditional support concerns internal API analysis/rewriting aligned with the
original objectives. No private report/contract has been edited.

## First deployment: AI stays off

1. Review and explicitly authorise pushing the verified local milestone to the
   existing private `tlqthai111/promptwise` repository. Check the deployed commit.
2. In Render choose Node, main, Singapore, blank Root Directory, one instance.
   The $7/month 0.5 CPU / 512 MB plan is the suggested pilot choice; choosing or
   creating a paid service requires the owner's approval. Keep workspace Hobby.
3. Build: `npm ci --omit=optional && npm run prepare:vendor`.
   Start: `npm start`. Auto-Deploy: Off. Build filters and Pre-Deploy: empty.
4. Add the following server environment variables. Never send secrets in chat,
   screenshots, commits or browser JavaScript; paste them directly into Render.

| Variable | Value |
| --- | --- |
| NODE_VERSION | 24 |
| HOST | 0.0.0.0 |
| PROMPTWISE_HOSTED | true |
| PROMPTWISE_DEMO_ACCESS | public (also the default when unset) |
| PROMPTWISE_DEMO_PASSWORD | Only required when DEMO_ACCESS is password; unused in public mode |
| PROMPTWISE_AI_ENABLED | false initially |
| OPENAI_API_KEY | The separate Render demo key, pasted privately |
| OPENAI_MODEL | gpt-4.1-mini-2025-04-14 |
| PROMPTWISE_AI_MAX_CALLS | 100 |
| PROMPTWISE_AI_BUDGET_USD | 5 |
| PROMPTWISE_DATA_DIR | /var/data |

Render supplies PORT and RENDER_EXTERNAL_HOSTNAME. Leave those and
PROMPTWISE_PUBLIC_ORIGIN unset. No Secret Files needed. For a custom domain,
set PROMPTWISE_PUBLIC_ORIGIN to its exact HTTPS origin; only that host is accepted.

5. To enable hosted AI later, add a **1 GB persistent disk**, mount `/var/data`.
   At the displayed $0.25/GB/month rate this adds $0.25/month to compute, before
   taxes or extra usage. This disk holds only usage counters, not student history.
   It may be added after the initial AI-disabled preview. Filesystem persistence
   depends on actually attaching the disk; a directory on ephemeral storage is
   not a persistent disk.
6. Change Health Check Path to `/healthz`. It returns only `{ "ok": true }`,
   makes no provider call and requires no password. `/api/config` reports AI
   availability, so it must NOT be the Render health check. Health is process liveness, not a
   guarantee that OpenAI or storage is currently healthy.
7. Only deploy after release authorisation. Open the provided HTTPS URL.
   In public mode the browser opens the app without credentials. For optional
   password mode, set PROMPTWISE_DEMO_ACCESS=password and a generated 32+
   character PROMPTWISE_DEMO_PASSWORD; the username is demo.
   Confirm Home, About and History, local mode, private paths denied, no secrets
   in the page/config, current service-worker version and the expected commit.
8. After checking disk attachment, API key permissions, model access and spending
   settings, explicitly authorise a small live test. Set AI_ENABLED to true and
   redeploy. Verify consent, analysis, rewriting, edits, exact copying, errors,
   Safari/phone behaviour and restart persistence before inviting others.

## Controls implemented

Public-access verification on 25 October 2026: all 75 regression tests passed
using mocked provider responses. The added checks cover anonymous app/config
access, private-file denial, Host/HTTPS/origin validation, shared cooldown,
reservation-budget exhaustion and call-limit persistence after restart.
Password-mode checks remain in the suite. No real OpenAI calls were made by
these regression tests. Existing usage storage is retained without reset.

- Hosted app content/assets and API routes are public by default. Optional
  password mode restores HTTP Basic authentication. Both modes retain HTTPS at
  the reverse proxy, the exact configured Host, exact Origin for AI POSTs and
  rejection of cross-site requests. Public access does not expose private server
  files, credentials, usage storage or any other user's browser-local History.
  Password mode uses fixed-size hashes and constant-time comparison. The health
  endpoint, `/demo` recovery page and `/sw.js` cleanup worker remain public.
- Render terminates TLS; only use this proxy setup with a trusted edge. The
  application trusts its X-Forwarded-Proto indication, not arbitrary client IP
  headers. It does not authenticate users by IP.
- One process handles one provider request at a time. A global 10-second spacing
  and counters are committed in SQLite before contacting OpenAI. Forwarded IPs
  cannot create extra allowances. SQLite transactions share the limits across
  connections and preserve them across restarts with the mounted disk.
- Default 100 hosted attempts when configured above. Failed/cancelled requests
  count. Restarts, redeploys and calendar boundaries do not replenish allowance.
- The internal US$5 reservation allowance uses full UTF-8 request bytes plus
  4,096 padding as an intentionally conservative input-token allowance, maximum
  output tokens (3,000/6,000) and checked GPT-4.1 mini rates ($0.40/$1.60 per
  million input/output tokens). Reservations are never refunded. It is an
  estimate, NOT actual OpenAI billing or a guaranteed provider spending cap.
  Review provider usage independently, including usage from other applications.
- Hosted model is pinned; changing to another model requires reviewing prices
  and the allowance implementation. No automatic retries, no tools, store:false.
- Corrupt/unwritable counters prevent new AI requests; no in-memory fallback or
  automatic reset. Local rules, editing and copying do not depend on this disk.
- Server storage contains only total calls, reserved micro-USD and last-start
  timestamp. No prompts, extracts, generated text, keys or passwords are recorded.

## Limitations and operation

- In optional password mode, a shared password is pilot access, not per-student sign-in, individual revocation,
  accounts or cross-device history. Do not reuse an account password. Share the
  demo password privately with intended testers, never the API key.
- Browsers may remember HTTP Basic credentials until their session ends. There
  is no sign-out UI. The hosted worker deliberately has no fetch handler or
  offline cache: reopening/reloading the hosted demo needs a connection. The
  local development worker retains offline support. Optional saved History must
  be exported/deleted using its existing controls. The password gate protects
  server access, not data already on a device. See [the browser-access fix](BROWSER_ACCESS_FIX.md).
- One shared allowance may mean testers wait for each other. Restarting the
  service cannot bypass the counter. The disk must stay attached; deleting or
  replacing it loses counters and invalidates that continuity. There is no
  automatic reset/admin dashboard. Raise limits only after reviewing API usage.
- Node 24's built-in SQLite currently prints an ExperimentalWarning. No new npm
  dependency was added. Keep Node pinned to major 24 and verify runtime upgrades.
- Render disks support one instance and cause brief redeploy downtime. Do not
  scale to multiple isolated disks/process deployments expecting shared limits.
- An API key expiring after the presentation needs replacement for ongoing use.
- Paid compute/storage, usage overages and OpenAI charges are separate. Back up
  important disk data before deleting the service/disk, then check Billing for
  remaining resources. Closing the browser does not stop hosting charges.

## Verification record

- `npm test`: 63/63 pass, including authentication, exact origin/Host/TLS,
  corrupt or unavailable counters, model restrictions, lifetime call/reservation
  limits, global cooldown, restart persistence and failed provider attempts.
- Isolated Chromium through a local HTTPS reverse proxy: 55/55 checks passed.
  All six tasks completed all five screens at 375 and 1440 px with seven criteria,
  edited text copied exactly, no sideways overflow and no runtime/console errors
  after the expected initial HTTP authentication challenge. About and History
  were accessible at both widths. The native password challenge was observed;
  service-worker v22 installed. About screenshots were inspected at both widths.
- 24 provider responses were simulated. Browser fixtures skipped the wall-clock
  cooldown; actual cooldown/restart sharing was separately checked in Node tests.
  No real API key, request or credit was used for verification.
- One real defect found during verification: system `/var` to `/private/var`
  aliasing was initially rejected as a symlink. Storage now canonicalises trusted
  parent paths while rejecting a symlink at the data directory/file itself.
  Two browser-harness assumptions were corrected (old criterion selector and
  expecting a page-load event on hash-only navigation).
- Outgoing 14-commit history was scanned for private reference paths, env files
  and key/private-key patterns: no matches. This is a focused scan, not a secret
  scanning certification. New source and tracked paths were reviewed as well.
- Not verified: the actual Render proxy, mounted disk across a real redeploy,
  live key permissions, provider connectivity/charges, Safari native auth,
  real phones or screen readers. Node SQLite emits its experimental warning.
  Invalid hosted configuration/storage intentionally prevents AI-enabled server
  startup; set AI_ENABLED=false to bring up the local-rules pilot while repairing
  its storage. Runtime counter errors return 503 without sending a prompt.

No Render service, remote push, payment or live OpenAI request is part of this
local milestone. Test scratch files, dummy keys and browser profiles are outside
Git. The original local development server was left running.

## Primary references checked

- [Render defaults](https://render.com/docs/environment-variables)
- [Render health checks](https://render.com/docs/health-checks)
- [Persistent disks](https://render.com/docs/disks)
- [Free service limits](https://render.com/docs/free)
- [Billing](https://render.com/docs/faq)
- [GPT-4.1 mini model and pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [API credential handling](https://developers.openai.com/api/reference/overview)
