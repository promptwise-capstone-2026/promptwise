# AI setup, assessment readiness and release

Prepared 10 October 2026. Requirements come from the supplied report/contract,
assignment text and Amara's conditional support. Recommendations are implementation
choices; this document does not amend the private originals or predict a grade.

## Readiness assessment

| Area | Evidence and remaining work |
| --- | --- |
| Functional scope | Five screens, six tasks, seven qualitative criteria, task-aware guidance, editable/copyable output and optional preferences are implemented. |
| Material handling | TXT/MD/PDF/DOCX/PPTX text can be reviewed and supplied in every task. No OCR, image/diagram understanding, audio or video. |
| AI coaching | Local backend and UI implemented; mocked integration verified. Personal key and real model evaluation are still needed. |
| Educational contribution | Explain the operational framework, task branching, evidence-based feedback, student review, source handling and independent evaluation. An API wrapper alone does not meet Amara's conditions. |
| Final report (70 points) | Needs actual methodology, results, discussion, limitations, updated architecture/scope, literature support and contribution evidence. Exact detailed report rubric and LOs were not supplied. |
| Final presentation (10 points) | Show the student problem, clear arguments, useful visuals, a short working demo, results and each member's contribution. Follow the supplied 6–9-minute limit. |
| Public release | Optional demonstration extension. Production-ready public deployment is explicitly out of scope in the supplied report. A domain is not needed to demonstrate the solution. |

A polished UI supports usability and presentation; it does not establish diagnostic
accuracy, better downstream answers or student learning. The learning contract's
9 October testing date has passed. Prioritise evaluation and the 16 October draft
report ahead of further visual features; final submission is recorded as 23 October.

## Personal OpenAI account

The user reports a US$10 top-up. No further purchase is needed to begin.

1. Sign in to the [API platform](https://platform.openai.com/) with your personal account.
2. Create/select a project called PromptWise and create a project API key. Confirm
   that billing and model access apply to the selected organisation/project.
3. In the VS Code terminal, from this project, run `cp .env.example .env` once.
   If `.env` already exists, edit it instead of overwriting it.
4. Open `.env` in VS Code. Paste the key after `OPENAI_API_KEY=` and set
   `PROMPTWISE_AI_ENABLED=true`. Keep HOST at 127.0.0.1. Never send the key in chat.
5. Stop the old dev server with Control-C, then run `npm run dev`. Refresh the app.
6. On Home, choose OpenAI mode and agree to send the selected text. Analyse a
   non-confidential example, add details and create the rewrite. Review the text.
7. Check the platform Usage dashboard and project limits. Turn off automatic
   recharge if you do not want automatic purchases. Use the billing controls shown
   for your account; this guide does not assume a particular credit minimum.

The key is loaded server-side with Node's environment-file support. It is never
returned by `/api/config` or included in browser assets. Local rules remain the
default, including offline use. An AI error never silently returns local output.

### Model, cost and limits — choices to evaluate

Trial model: `gpt-4.1-mini-2025-04-14`, configurable with OPENAI_MODEL. This
snapshot supports Responses and structured outputs, with published standard
text rates of US$0.40 per million input tokens and US$1.60 per million output
on the documentation checked today. It is a low-cost starting candidate, not
an evaluated winner. Test its judgements and rewrite quality before choosing it.

Illustration: if one complete analyse-plus-rewrite cycle totals 10,000 input
and 3,000 output tokens, the model charge is approximately US$0.0088, or US$0.88
for 100 such cycles. This is arithmetic, not measured PromptWise usage or a
monthly guarantee. Longer material, longer output, retries and a different model
change costs. API usage is metered; a month of unlimited access is not assumed.

Defaults: 60,000 JSON characters per AI request (no silent truncation), 3,000
analysis/6,000 rewrite output tokens, 45-second provider timeout, one concurrent
request and 50 attempts per server run. Failed attempts also count. Cancellation
can stop a pending request but does not guarantee that provider charges are undone.
The run allowance resets at restart and is NOT a persistent or dollar spending cap.

### Data flow and limits

- Analyse sends the original prompt and Others description; later personalisation
  does not change the saved first diagnosis.
- Create sends relevant field text, accepted document extracts and preferences.
- Original files, pictures and video are not sent. No tools, web search or file
  storage are used by this adapter. The server does not log/persist input content.
- Requests set `store: false`. This does not mean zero retention: provider abuse
  monitoring and account data-control policies still apply.
- The criteria operational questions come from report section 3.3.2. Schema and
  exact-evidence checks reject malformed findings and invented quotations, but
  cannot prove that an AI judgement or rewritten prompt is correct.

## Private GitHub setup

Authorised target: `tlqthai111/promptwise`, private. Preserve local milestone history.
Before upload, check tracked files and reachable history for secrets and private
artifacts. `.gitignore` does not remove something already committed.

Use GitHub Desktop: File → Add Local Repository → this project path → Publish
repository. Verify account `tlqthai111`, name `promptwise`, and Keep this code
private checked. Do not initialise a separate repository with an unrelated README.
After upload, verify the remote, private visibility and matching HEAD. The included
GitHub Actions workflow runs the local tests without an API key or paid calls.

Suggested ongoing workflow: describe the issue to Codex; agree on behaviour;
Codex handles shared/backend integration and Claude handles visual changes;
only one edits shared files at a time; test; review; commit; push to the private
repository. Check tests before sharing a demo. Publication remains a separate step.

## Hosting and optional domain

Recommended first candidate: one Render Node Web Service serving browser and
backend from the same origin. Build: `npm ci --omit=optional && npm run prepare:vendor`.
Start: `npm start`. HOST: `0.0.0.0`; PORT: provider supplied.

Do not enable AI or add an API key to that hosted service yet. This milestone
rejects remote AI access and refuses CLI startup with AI enabled on a public
bind address. Before hosted AI, implement authenticated/invite access, durable
request/spend controls, rate limiting suitable for proxies and restarts, and verify
privacy, errors, HTTPS, service-worker updates and the deployed six-task workflow.
A private GitHub repository does not make a deployed website private.

Render gives a provider URL, so no domain is necessary initially. Its free web
service currently sleeps after 15 minutes idle and can take about a minute to
start. That can affect a timed presentation; decide whether paid compute is worth
it after staging. API credits, hosting and domain registration are separate costs.
A custom domain can be connected once the demo is stable and the team selects a
name; check purchase and renewal prices before buying.

## Evidence to collect next

Use independently reviewed examples across all six tasks; compare local and AI
findings with human labels. Compare original and improved prompts for intent,
unsupported assumptions, relevant detail and output constraints. Test downstream
answers under comparable conditions using the team's agreed tool. Run a small
student usability session and report sample size, observations, failures and
limitations. Record model snapshot, application commit, date, token counts and
latency. Avoid using AI self-ratings as the sole measure of success.

## Official references checked

- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Trial model and pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
- [Production practices](https://developers.openai.com/api/docs/guides/production-best-practices)
- [Render Web Services](https://render.com/docs/web-services)
- [Render free service limits](https://render.com/docs/free)
- [GitHub Pages static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
