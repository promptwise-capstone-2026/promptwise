# PromptWise local prototype

PromptWise helps students inspect and improve a prompt before copying it into a generative AI tool. This first version uses a transparent, task-aware rules engine. It makes no AI API calls and sends no prompt data to a server.

## Run on this Mac

1. Open this folder in Visual Studio Code.
2. In its terminal, run `npm run dev`.
3. Open `http://127.0.0.1:4173` in a browser.
4. Run `npm test` to check the rules engine.

Node 20 or later is required. There are no packages to install. The local server listens only on this Mac. Browser clipboard access works on localhost. The app can be added to a compatible browser's home screen.

## Source and decisions

The report and learning contract are stored in `private/references/` on this Mac and excluded from Git. See [PROJECT_NOTES.md](PROJECT_NOTES.md) for confirmed requirements, design observations, and open decisions. Do not commit reports, learning contracts, `.env` files, or exported designs.

This repository is local only. No Git remote is configured.
