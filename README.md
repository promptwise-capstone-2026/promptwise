# PromptWise

**A student prompt coach developed for the UTS Information Systems Capstone, 2026.**

PromptWise helps students turn an initial idea into a clearer prompt. It explains
missing or unclear details, offers task-specific personalisation, and produces a
draft the student can review, edit and copy into their chosen AI tool.

**[Open the hosted demo](https://promptwise-ljw9.onrender.com/)** ·
[Team source repository](https://github.com/promptwise-capstone-2026/promptwise)

The hosted demo is open without an account or password. OpenAI analysis and
rewriting share a limited allowance; local rules, editing and copying remain
available when it is exhausted. API keys are never included in browser code.
Using the website does not require GitHub access, local installation or your own
API key. The source repository remains private.

## Current features

- Five steps: **Task → Prompt → Analysis → Personalise → Compare**.
- Six task types: Study Support, Summarisation, Coding Assistance, Report Writing,
  Presentation Preparation and Others.
- Seven task-aware criteria: clarity, context, specificity, constraints, output
  format, audience/level and input/source material. Findings are guidance, not grades.
- Local rules mode without an API key, or optional OpenAI analysis and rewriting
  after explicit consent. Each result identifies its mode.
- Browser extraction of text from PDF, DOCX, PPTX, TXT and MD files, with review
  before accepting the extracted text. Code fields accept TXT/MD only.
- An editable improved prompt, exact-text copying and synthetic practice examples.
- Optional browser-local History, export/deletion controls and saved-work recovery.
- Responsive layouts, keyboard controls and reduced-motion support.

The app does not automatically submit the final prompt to another AI tool for
completion of the student's task.

## Run on your computer

Use **Node.js 24 LTS**, matching CI and the hosted demo. The package minimum is
Node 22.13. Install Node.js from [nodejs.org](https://nodejs.org/en/download).

1. Accept the GitHub repository invitation and sign in to view the private source.
2. Download **Code → Download ZIP** and extract it, or clone the repository if you
   already use Git.
3. Open the project folder, where `package.json` is located. In VS Code, choose
   **File → Open Folder**, then **Terminal → New Terminal**.
4. Install dependencies:

   ```sh
   npm ci --omit=optional
   ```

5. Start the local server:

   ```sh
   npm run dev
   ```

6. Open **http://127.0.0.1:4173/**. Keep the terminal open while using the app;
   press **Ctrl+C** to stop the server.

A fresh checkout runs local rules without a `.env` file or API key. Local OpenAI
mode needs separate server-side configuration; use the hosted demo to test AI
without configuring your own key. The demo password is for the hosted website,
not GitHub sign-in or local rules.

The dev/test commands prepare local parser assets automatically. The local server
binds to this computer's loopback address. No CDN is used at runtime. Clipboard
access works on localhost. These steps follow the checked project scripts; they
are not evidence of testing every teammate's operating system.

## Team access and feedback

Reviewers can use **Read** access to view/download source and discuss issues in
this Organization repository. Local edits to a downloaded copy do not change
this repository. The project lead manages integration and deployment.

For a bug report, include the task, browser/device, steps to reproduce, expected
behaviour and actual behaviour. Add a screenshot with sensitive text hidden.
Use short, non-sensitive examples when testing the shared AI allowance.

The deployment source remains `tlqthai111/promptwise`; the team review copy is
`promptwise-capstone-2026/promptwise`. They do not synchronise automatically.
Update the team copy when publishing a new reviewed milestone. Development
commands do not push code or deploy the website automatically.

## Team and responsibilities

| Team member | Responsibility focus |
| --- | --- |
| Luu Quoc Thai Tran | System architecture, prompt-framework implementation, application development, AI/API integration, evaluation planning and overall technical integration. |
| Noah Holt | Prompt-engineering and prompt-quality research, GenAI in higher education, existing-tool research, test prompts/use cases and related literature review contributions. |
| Angela Liu | Student use of GenAI, user requirements, mobile user flows, wireframes and usability-test planning. |

**Shared work:** the Design Thinking process, existing-tool review, testing,
meetings, presentations, discussion/conclusions and final-report review.
**Project supervisor:** Dr Amara Atif.

These are responsibility focus areas, not proof that all allocated activities
have been completed. Final contribution records should reflect actual work.
See [About page content](docs/ABOUT_CONTENT.md) for the detailed credits.

## Technical overview

- **Frontend:** HTML, CSS and JavaScript ES modules; no frontend framework.
- **Server:** Node.js HTTP server with a static-file allowlist and server-side
  OpenAI Responses API integration. API credentials stay on the server.
- **Document text:** PDF.js and fflate with browser-side extraction and limits.
- **Storage:** optional student History in browser storage; SQLite on a Render
  persistent disk stores only hosted AI usage counters.
- **Hosting and checks:** Render Node web service; GitHub Actions runs local tests.

## Verification and limits

Run the non-billable regression checks with:

```sh
npm test
```

The recorded hosted milestone passed **63/63 regression tests** and **55/55
mocked browser checks** before release; see [the verification record](docs/RENDER_DEMO_SETUP.md#verification-record).
On 10 October 2026, the project lead reported successful hosted AI analysis and
rewriting. Read-only counter checks before and after a Render service restart
both returned `calls: 2` and `reserved_micro_usd: 21380`, confirming persistence
for that tested restart. These counters are reservations, not provider billing.

The 11 October browser-authentication fix passes **65/65 regression tests** and
**55/55 mocked workflow checks**. It also reproduces and repairs the old-worker
login failure across browser restarts while retaining saved History and recovery.
See [browser access fix and remaining device checks](docs/BROWSER_ACCESS_FIX.md).

Known limits:

- Public demo with a shared AI allowance; no individual accounts or cross-device sync.
- Reopening or reloading the hosted demo requires a connection. Local development
  retains offline support; saved History is still local to each browser.
- No OCR or interpretation of scanned pages, images, diagrams, audio or video.
- History can be lost when browser data is cleared; export important work.
- AI suggestions can be wrong; independent learning-effectiveness and model-quality
  evaluation remain open. Findings and usage counts do not prove learning gains.
- Automated accessibility checks and targeted manual checks have been recorded;
  no WCAG conformance certification is claimed. Real-device and assistive-technology
  coverage remains limited; see [the frontend review](docs/FRONTEND_CONSISTENCY_REVIEW.md).
- Pilot API requests share a global allowance and a ten-second spacing rule.
  The internal budget estimate is not a guaranteed OpenAI spending cap.

## Supplying material

Every task offers a visible source-material field. PDF, DOCX and PPTX text extraction runs in the browser; TXT and MD remain supported. Documents have a 10 MB limit, TXT/MD a 1 MB limit, and extracted text a 120,000-character limit per file. PDF/PPTX files are limited to 100 pages/slides. Office archives have a 20 MB expansion limit.

Review and edit a document's extracted text, then select Use this text, Replace current text or Add below current text. Add further files one at a time. The source field and final prompt remain editable. Scans, images, diagrams and video are not interpreted. The app reports missing text and extraction limits. Copy transfers the reviewed text only; it does not attach the original files to another tool.

The source diagnosis still depends on the task: a general study explanation can be N/A even though optional material can be added. Personalisation does not overwrite the saved original-prompt analysis.

## Source and decisions

Private assessment documents and real `.env` files are excluded from Git.
They are not required to run local rules. See [PROJECT_NOTES.md](PROJECT_NOTES.md)
and [the personalisation/material review](docs/PERSONALISATION_MATERIALS_REVIEW.md)
for requirements, implementation choices and limits. Keep reports, learning
contracts, credentials, exported designs, dependencies and generated parser assets
out of Git.

This is a private team repository. A public portfolio release is a separate
publication decision. Amara's conditional support covers internal API analysis
and rewriting aligned with the original objectives; it is not approval of every
extension. Optional History is user-authorised and academic scope confirmation
remains pending.

## Copyright and licensing

© 2026 PromptWise Project Team: Luu Quoc Thai Tran, Noah Holt and Angela Liu.

The team's original project documentation and educational explanatory text are
licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
Non-commercial sharing and adaptation require attribution, a licence link and
identification of changes. Commercial reuse requires separate permission from
the relevant rights holders, unless permitted by law.

This is a content licence, not a software licence. See [LICENSE.md](LICENSE.md)
for the scope and exclusions, including source code, third-party dependencies,
portraits and user-supplied materials. Adding this notice does not publish the
private repositories or assessment documents.

## Optional local AI testing

See [AI setup and release guide](docs/AI_SETUP_AND_RELEASE.md). Copy `.env.example`
to `.env`, set your personal project key and `PROMPTWISE_AI_ENABLED=true`, then
restart the server. Never commit or paste a real key into chat. Choose OpenAI
mode on Home and agree to the text disclosure before analysing. You can keep
using local rules without a key. Real connectivity and calibration checks are recorded in
[the AI integration review](docs/AI_INTEGRATION_REVIEW.md); independent model-quality evaluation remains open.

`npm start` also prepares local parser assets. The deployed pilot uses a Node
web service with `HOST=0.0.0.0`, the provider's `PORT`, shared access protection and
durable usage controls. See [Render demo setup](docs/RENDER_DEMO_SETUP.md).
The `.github/workflows/checks.yml` workflow runs non-billable tests on pushes and
pull requests; it does not deploy the website.

## Practice examples

On Home, select **Try an example** to fill a task, original prompt, task details
and preferences. All content is synthetic and editable. Eighteen scenarios cover
all six tasks; each is drawn once in a shuffled cycle, then a new cycle begins
without an immediate repeat. Reloading the page resets the deck. These examples
are for demonstration and exploration, not a held-out evaluation set.

Loading does not call AI, check consent or skip steps. Review mode and existing
consent are kept. Existing user inputs, files or results require confirmation
before replacement; untouched samples can be cycled freely. Analyse still checks
only the original prompt/custom task, not the preloaded personalisation details.

## Optional History on this device

Enable **Save history on this device** on Home or in History. Saving is off by
default. This keeps prompts and results in this browser at this website address;
there is no account or device sync. The five-screen flow also works without saving.

History keeps the original prompt, its initial seven-criteria evaluation,
generated draft and latest edited version separately. Saved evaluation cards use
the same status colours, icons and labels as Analysis. Open History from the Home
link or any screen's footer to read, copy, reuse or delete a saved attempt.

Refresh and select **Resume saved work** on Home to recover unfinished text and
results without another AI request. Saving can include accepted source text and
preferences for recovery; original files and pending extraction choices are not
saved. API consent is never restored. Reusing a history original starts a new
attempt without its material fields or preferences.

History settings includes JSON export and **Remove saved data & turn saving off**.
Browser data can be lost, and exports may contain private text. JSON import is not
implemented. Storage is limited to 50 attempts and 1,800,000 serialized characters;
failed saves display an error rather than silently removing older entries.

The demo-profile and learning-dashboard UI have been removed at the user's
request. Cross-device accounts and a simpler chart-based dashboard are deferred.
Existing saved history remains compatible. See [the simplification review](docs/SIMPLE_HISTORY_REVIEW.md).
This history extension is user-authorised; academic scope confirmation remains pending.

## Hosted demo

See [Render demo setup](docs/RENDER_DEMO_SETUP.md). From 25 October 2026 the hosted
demo defaults to public access, with no username or password. AI usage counters
still persist on the server disk; student History remains optional and
browser-local. No allowance is reset by this access change.
Set `PROMPTWISE_DEMO_ACCESS=password` with a strong `PROMPTWISE_DEMO_PASSWORD`
to restore the optional shared browser password prompt. `public` is the default;
other values are rejected. Do not disable `PROMPTWISE_HOSTED` to remove the gate,
because hosted mode also enables the durable usage controls.
An affected browser can still open `/demo` to update old app files without
deleting History. The hosted worker remains free of offline fetch interception.
The project lead has checked the initial hosted workflow and counter persistence
as recorded above. For any new deployment, keep AI disabled until access and
persistent storage are checked. Publishing code, changing repository visibility,
creating paid services and live API testing remain explicit release actions.
