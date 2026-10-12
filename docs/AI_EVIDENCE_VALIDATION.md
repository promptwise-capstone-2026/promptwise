# Analysis evidence validation repair — 13 October 2026

## Observed failure

The user reported two rejected OpenAI-mode analysis attempts for evaluation case S2 (Summarisation). The screenshot retained the correct original instruction and fictional library source paragraph. The displayed error identifies the exact-substring evidence validator. The rejected provider output was not retained, so the particular quote and whether it was paraphrased, fabricated or changed in punctuation remain unknown.

## Repair

Analysis now builds a request-specific strict JSON schema whose evidence values are exact excerpts selected from the original diagnostic input (and the custom task description for Others). The model selects a supplied excerpt or an empty string instead of retyping a free-form quote. The independent substring validation remains in place; invented quotes are still rejected. Later personalisation material remains excluded from initial analysis. Rewriting is unchanged. There are no automatic retries or additional provider calls.

Excerpts are split at sentence/line boundaries, then at 240 Unicode code points. At most 32 nonempty excerpts are offered, evenly sampled over longer inputs. The complete input is still supplied to the model. A relevant passage outside the offered excerpts can lead to an empty evidence field. Schema excerpts add input tokens and are included in the existing conservative request-size budget reservation. Exact quotation does not guarantee that the model selects relevant evidence or makes a correct judgement; student review remains necessary.

## Verification and limits

- `npm test`: 68/68 passed, including three new tests covering the S2 source, all six tasks, isolation from later material, long Unicode input and rejection of invented quotes.
- `git diff --check`: clean.
- Provider responses were mocked; no paid API calls were made by the reviewer.
- Official Structured Outputs documentation confirms enum support: https://developers.openai.com/api/docs/guides/structured-outputs
- This is a local verified change. Hosted deployment and a user-run live S2 analysis are pending. Tests do not establish the exact original cause or guarantee all future provider responses will succeed.

Retain the two failed attempts as app reliability observations, separate from completed downstream answer comparisons. Do not erase them when a subsequent run succeeds.
