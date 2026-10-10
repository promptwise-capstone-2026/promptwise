# Local AI integration review — 10 October 2026

Implemented against baseline b061ec2. This records integration evidence, not
independently measured model accuracy or assessment results.

- `npm test`: 46/46 pass on the actual project. Tests use simulated provider
  responses; they make no OpenAI calls or incur API charges.
- Nine focused headless-Chromium groups passed: local default; AI text disclosure;
  consent blocking transmission; seven-criterion AI rendering; source text in an
  editable/copyable rewrite; current About wording; rate-limit recovery; edit-during-
  analysis cancellation; and all six local five-screen flows.
- Reviewed the Home screenshot at 375px. Broader responsive/device coverage from
  the previous material milestone is not a claim that every new AI state has been
  tested on every device. Safari, Firefox, real phones and screen readers remain open.
- Remote-call denial and simultaneous-request rejection were also verified.
- Static allowlist includes the browser AI client only. Backend modules, `.env`,
  private references and Git metadata remain inaccessible through the static server.
- Service-worker cache bumped to v7 and includes the client module. `/api/*` is
  outside its cache allowlist. A fresh AI-enabled offline request must fail clearly;
  automatic switching to local output is not permitted.
- Reachable history before this milestone: 91 blobs checked for common private-key,
  OpenAI-key and GitHub-token patterns; zero matches. No private/report/contract/
  design binary paths in that history. Pattern scanning cannot prove the absence
  of every possible secret. `.env` and private references are ignored.
- No real API key read or returned. The server loaded the user-saved key for
  authorised live tests. No private references were uploaded; no domain was
  purchased or hosting deployed.

## Live calibration checks

Personal key configured by the user; tested through the actual localhost API on
10 October 2026 using synthetic non-confidential examples and the pinned
`gpt-4.1-mini-2025-04-14` model.

- Initial checks found an invented evidence quote, correctly rejected by runtime
  validation, and over-requiring constraints/source material. Added the report's
  worked Study Support example, explicit exact-quote instructions and independent
  criterion/applicability guidance. Rewrite guidance now avoids warnings for absent
  optional preferences and unsupported audience assumptions.
- A complete six-task run returned 12/12 successful analysis/rewrite responses.
  Observed latency: 996–3,961 ms. Reported usage: 8,208 input / 2,872 output tokens.
- A focused follow-up returned 8/8 successful responses: six analyses plus two
  rewrites. Latency: 1,229–4,141 ms; usage: 6,542 input / 2,589 output tokens.
  The two rewrites omitted the previous unnecessary tone/audience warnings.
- These 20 successful requests estimate US$0.01464 at the documented standard
  text rates. This excludes the earlier three calibration attempts and subsequent
  browser requests; the provider Usage dashboard is authoritative for total cost.
- Successful response/schema/evidence validation does NOT establish diagnostic
  correctness. The Study Support example matched the report, but summarisation
  and report feedback sometimes conflated missing source with partial clarity.
  Presentation and Others still over-required source material in the follow-up,
  despite applicability instructions. These are unresolved model-judgement limits.
  No local override hides them and no accuracy percentage is claimed.
- One additional real 375px browser flow passed: seven criteria rendered,
  accepted lecture text used for rewriting, edited text copied, no horizontal
  overflow and no JavaScript exceptions. Two paid requests; this verifies UI
  integration, not the correctness of every finding or rewrite.
- These examples informed calibration and are not a held-out evaluation set.
  Preserve the local baseline and compare independent human labels before choosing
  a final model or treating AI findings as reliable assessment measures.

## Remaining work

Collect independent
human and student evaluation evidence. Verify the uploaded private repository
and CI separately. Hosted AI needs access and durable usage controls before
activation; the localhost guard is not a production authentication solution.
