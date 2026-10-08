# PromptWise implementation notes

## Confirmed in the supplied documents

- The report specifies a task-aware intake, analysis, understandable explanations, an improved prompt that the student can edit and copy, a before/after comparison, and a responsible-use reminder.
- Its seven diagnostic criteria are clarity, context, specificity, constraints, output format, audience/level, and input/source material. Statuses are Present, Partial, Missing, and N/A. Criteria activate according to task; there is no single numerical quality score.
- Tone, response depth, and examples are preferences. They are not universal diagnostic criteria.
- The report names study support, summarisation, coding assistance, presentation preparation, and writing feedback as task pathways. The learning contract also names report writing. The supplied Home screen includes all of these plus Others.
- The learning contract dates the functional prototype to 2 October 2026, testing to 9 October, draft report to 16 October, and final submission to 23 October.

## Observed in the supplied design material

- The `.fig` archive metadata identifies the PromptWise UI Prototype export. The live Figma connection required a selected layer, so screen details below come from the supplied PNG exports.
- Five mobile stages: Home, Prompt Input, Prompt Analysis, Prompt Personalisation, Compare the prompts.
- White background, black headings, grey choice cards and buttons, red/green analysis accents, and a single-column mobile layout.
- The Study Support example uses “Explain phishing.” as the original prompt. The final Figma text is static, but the report requires the improved prompt to be editable.
- The example analysis lists Tone as missing. This conflicts with the report's framework; the implementation keeps Tone optional.
- A user-provided audit update reports 11 mobile frames in the decoded `.fig`, with only six PNG exports. It identifies additional empty-input and personalisation states, and a System Architecture canvas naming Microsoft Copilot. These are attributed audit findings; this notes update does not independently verify the decoded frame inventory. Frontend work should inspect the full export or available audit output.

## Version 1 design choices to review with the team

- Use dependency-free web standards so the prototype runs immediately in VS Code on this Mac.
- Keep all analysis and prompt content in browser memory only. Reloading starts a fresh session.
- Use explicit heuristic rules. A status is guidance based on visible words and fields, not a claim that a model understands the student's intent.
- Missing source material is represented by a visible placeholder or a request to clarify; the engine does not invent it.
- The report contains both Copilot-only notes and an evaluation procedure involving selected GenAI tools. The app produces a copyable prompt without choosing the evaluation tool. The team still needs to decide the evaluation protocol.
- The report's performance target is blank; no numeric speed target is assumed.

## Iteration started on 8 October 2026

- The user requested a clearer responsive interface, a meaningful Others description on Home, expandable analysis cards, task-relevant personalisation, attachment intake, required-field stars and actual AI evaluation/rewriting.
- The user assigned frontend work to Claude and shared logic/backend/integration to Codex. Use `docs/FRONTEND_HANDOFF.md` for the current frontend milestone and shared JavaScript interfaces. Take turns editing the local checkout.
- OpenAI evaluation and rewriting remain proposed. The report lists direct submission to Copilot or other model APIs as out of scope. Noah interprets this as excluding automatic downstream submission rather than an internal coaching API; the supervisor's confirmation is pending. No API requests, API dependencies or billing configuration are added in this milestone.
- The baseline implementation remains available at commit `cb364f8`. The current local rules no longer infer specificity from length alone or supplied source material from long multiline text. Referencing absent material is Missing, consistent with the report's definition; source presence still does not prove completeness or relevance.
- `validation.js` adds task-aware form checks, including Others and conditional Other-format description. Obvious placeholders can be rejected; arbitrary semantic suitability cannot be established by these local checks. The 240-character task-description limit is a prototype choice.
- `guidance.js` prioritises relevant personalisation fields without forcing all criteria to be answered, and avoids repeating Others. Audience choices are separated from the educational-level dropdown.
- `workflow.js` exposes a local adapter returning an explicit `local-rules` mode. It creates an assembled draft, not a simulated AI rewrite. Frontend wiring of this adapter is the next Claude milestone.
- `materials.js` reads user-selected UTF-8 `.txt` and `.md` content in memory, within a prototype 1 MB limit. File-picker wiring is the next frontend milestone; PDF, Word and image processing are not implemented here.
- All previously supplied assignment descriptions, rubrics and teaching examples are the current assessment evidence. The detailed final-report marking table was not included in the supplied text; no additional unseen rubric is assumed. API use does not establish a predicted mark.
