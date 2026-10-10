# PromptWise

PromptWise helps students inspect and improve a prompt before copying it into a generative AI tool. Local rules mode is the default and keeps prompt processing in the browser. Optional OpenAI analysis and rewriting are implemented for local testing after configuring a server-side key. AI mode sends selected text only after explicit agreement and action; each result identifies its mode.

## Run on this Mac

1. Open this folder in Visual Studio Code.
2. Install the pinned browser parsers with `npm ci --omit=optional` (once after cloning or dependency changes).
3. Run `npm run dev`.
4. Open `http://127.0.0.1:4173` in a browser.
5. Run `npm test` to check shared logic, file validation and static-server privacy controls.

Node 22.13 or later is required (the current Mac has Node 24). The dev/test commands prepare local parser assets automatically. The server listens only on this Mac. No CDN is used at runtime. Clipboard access works on localhost.

## Supplying material

Every task offers a visible source-material field. PDF, DOCX and PPTX text extraction runs in the browser; TXT and MD remain supported. Documents have a 10 MB limit, TXT/MD a 1 MB limit, and extracted text a 120,000-character limit per file. PDF/PPTX files are limited to 100 pages/slides. Office archives have a 20 MB expansion limit.

Review and edit a document's extracted text, then select Use this text, Replace current text or Add below current text. Add further files one at a time. The source field and final prompt remain editable. Scans, images, diagrams and video are not interpreted. The app reports missing text and extraction limits. Copy transfers the reviewed text only; it does not attach the original files to another tool.

The source diagnosis still depends on the task: a general study explanation can be N/A even though optional material can be added. Personalisation does not overwrite the saved original-prompt analysis.

## Source and decisions

The report and learning contract are stored in `private/references/` on this Mac and excluded from Git. See [PROJECT_NOTES.md](PROJECT_NOTES.md) and [the personalisation/material review](docs/PERSONALISATION_MATERIALS_REVIEW.md) for requirements, implementation choices and limits. Keep reports, learning contracts, `.env` files, exported designs, dependencies and generated parser assets out of Git.

A private source backup is configured at `tlqthai111/promptwise`. Setup and development commands do not push code or deploy the website automatically.

## Optional local AI testing

See [AI setup and release guide](docs/AI_SETUP_AND_RELEASE.md). Copy `.env.example`
to `.env`, set your personal project key and `PROMPTWISE_AI_ENABLED=true`, then
restart the server. Never commit or paste a real key into chat. Choose OpenAI
mode on Home and agree to the text disclosure before analysing. You can keep
using local rules without a key. Real connectivity and calibration checks are recorded in
[the AI integration review](docs/AI_INTEGRATION_REVIEW.md); independent model-quality evaluation remains open.

`npm start` also prepares local parser assets. Hosting uses a Node web service,
with `HOST=0.0.0.0` and the provider's `PORT`. Remote AI is unavailable at this
milestone; hosted AI needs access and durable usage controls before activation.
The `.github/workflows/checks.yml` workflow runs non-billable tests when uploaded.

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
