# PromptWise local prototype

PromptWise helps students inspect and improve a prompt before copying it into a generative AI tool. This version uses a transparent, task-aware rules engine. It makes no AI API calls and sends no prompt or selected-file data to a server.

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

This repository is local only. Nothing is published or pushed by setup or development commands.
