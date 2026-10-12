# Rewrite material retention — 13 October 2026

## Observed issue

The user supplied the S3 Coding Assistance generated prompt. It described an average function, expected/actual behaviour and tests, but omitted the original function code. The exact live request body is unavailable, so which Personalisation values were submitted is not independently confirmed. The prepared original prompt contained the code. Inspection showed rewrite validation only checked for a nonempty bounded string; it did not enforce material retention. A mocked provider response reproduces the omission path.

## Local repair

After validating a rewrite, append any supplied task material that is not already included verbatim, using its known field label and a fenced reference block. This covers code, source, draft and multiline requirements. For Coding with no separate code field, preserve the complete original coding request if missing, rather than trying to extract code heuristically. Preserve provider warnings, add a review notice when restoring material, and avoid duplicate exact material. Fence length accommodates embedded backticks. No automatic retry or extra provider request occurs. If the completed prompt exceeds 40,000 characters, report an error without truncating user material.

This safeguards text inclusion, not semantic correctness: rewritten instructions can still misinterpret source material, and a modified quotation may coexist with the authoritative verbatim block. Student review remains necessary. Original-only material fallback currently applies to Coding; other tasks rely on their dedicated material fields. Unread files or text never accepted into the request cannot be restored.

## Evaluation handling

Retain the original omitted-code output as an app reliability observation. Do not silently append code for the primary comparison or label a manually repaired prompt an unchanged AI rewrite. Generate and freeze a new prompt after deployment, or explicitly document a manual edit if used. Do not claim the simple average fixture proves PromptWise is better than a direct coding assistant. The predeclared expected/actual fields already expose the bug: the case mainly tests briefing clarity, handling empty input and output structure. A minimal prompt may produce equivalent or better results. Report those outcomes and the additional user effort honestly.

## Verification status

`npm test`: 71/71 passed, including omitted S3 code, original-only coding input, embedded fences, existing exact code without duplication, all six material pathways, draft/requirements retention and refusal to truncate oversized completed prompts. `git diff --check`: clean. Provider responses were mocked; no reviewer paid API calls. Hosted deployment and live generation are pending; no deployment authorised for this new repair yet.
