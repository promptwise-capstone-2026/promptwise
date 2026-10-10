# Local AI integration review — 10 October 2026

Implemented against baseline b061ec2. This records integration evidence, not
live model accuracy or assessment results.

- `npm test`: 44/44 pass on the actual project. Tests use simulated provider
  responses; they make no OpenAI calls or incur API charges.
- Nine focused headless-Chromium groups passed: local default; AI text disclosure;
  consent blocking transmission; seven-criterion AI rendering; source text in an
  editable/copyable rewrite; current About wording; rate-limit recovery; edit-during-
  analysis cancellation; and all six local five-screen flows.
- Reviewed the Home screenshot at 375px. Broader responsive/device coverage from
  the previous material milestone is not a claim that every new AI state has been
  tested on every device. Safari, Firefox, real phones and screen readers remain open.
- Static allowlist includes the browser AI client only. Backend modules, `.env`,
  private references and Git metadata remain inaccessible through the static server.
- Service-worker cache bumped to v7 and includes the client module. `/api/*` is
  outside its cache allowlist. A fresh AI-enabled offline request must fail clearly;
  automatic switching to local output is not permitted.
- Reachable history before this milestone: 91 blobs checked for common private-key,
  OpenAI-key and GitHub-token patterns; zero matches. No private/report/contract/
  design binary paths in that history. Pattern scanning cannot prove the absence
  of every possible secret. `.env` and private references are ignored.
- No real API key read or returned; no private reference upload, domain purchase,
  hosting deployment or live AI quality claim was part of these checks.

## Remaining work

Configure the personal project key and run representative live examples. Verify
account/model access, latency, usage and prompt quality. Collect independent
human and student evaluation evidence. Verify the uploaded private repository
and CI separately. Hosted AI needs access and durable usage controls before
activation; the localhost guard is not a production authentication solution.
