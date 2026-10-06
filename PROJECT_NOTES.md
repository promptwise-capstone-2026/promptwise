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

## Version 1 design choices to review with the team

- Use dependency-free web standards so the prototype runs immediately in VS Code on this Mac.
- Keep all analysis and prompt content in browser memory only. Reloading starts a fresh session.
- Use explicit heuristic rules. A status is guidance based on visible words and fields, not a claim that a model understands the student's intent.
- Missing source material is represented by a visible placeholder or a request to clarify; the engine does not invent it.
- The report contains both Copilot-only notes and an evaluation procedure involving selected GenAI tools. The app produces a copyable prompt without choosing the evaluation tool. The team still needs to decide the evaluation protocol.
- The report's performance target is blank; no numeric speed target is assumed.
