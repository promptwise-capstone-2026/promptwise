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
- Amara's reply, supplied by the user and recorded on 8 October, conditionally supports internal OpenAI analysis and rewriting. She accepts the interpretation that the out-of-scope item concerns automatic downstream submission for task completion. The updated scope must state this distinction, retain the original objectives and assessment requirements, preserve the learning outcomes, and demonstrate a contribution beyond a basic AI-service interface. See `docs/AI_SCOPE_AND_EVALUATION.md`. API implementation, dependencies and billing configuration have not been added to the running app.
- The baseline implementation remains available at commit `cb364f8`. The current local rules no longer infer specificity from length alone or supplied source material from long multiline text. Referencing absent material is Missing, consistent with the report's definition; source presence still does not prove completeness or relevance.
- `validation.js` adds task-aware form checks, including Others and conditional Other-format description. Obvious placeholders can be rejected; arbitrary semantic suitability cannot be established by these local checks. The 240-character task-description limit is a prototype choice.
- `guidance.js` prioritises relevant personalisation fields without forcing all criteria to be answered, and avoids repeating Others. Audience choices are separated from the educational-level dropdown.
- `workflow.js` exposes a local adapter returning an explicit `local-rules` mode. It creates an assembled draft, not a simulated AI rewrite. Claude wired this adapter into the five screens at `5ba453d`.
- `materials.js` reads user-selected UTF-8 `.txt` and `.md` content in memory, within a prototype 1 MB limit. Claude wired the file controls at `5ba453d`; PDF, Word and image processing are not implemented here.
- All previously supplied assignment descriptions, rubrics and teaching examples are the current assessment evidence. The detailed final-report marking table was not included in the supplied text; no additional unseen rubric is assumed. API use does not establish a predicted mark.

## Frontend integration review on 8 October 2026

- Codex reviewed Claude's local milestone `5ba453d`, confirmed its ownership boundaries and independently reproduced the case-variant private-file route. The static server now serves only explicitly listed browser assets and rejects symlink aliases. Add future browser modules to the server allowlist as well as the service-worker cache.
- Shared guidance now explains each field separately, removes misleading Optional prefixes from recommended fields, and keeps current knowledge as an optional detail for tailoring an explanation. This prioritisation is an implementation choice, not an additional report requirement.
- Drafts and diagnostic wording use Educational level consistently. Missing-source hints name relevant material by task. Others receives general missing-information and verification guidance without inventing a task-specific procedure.
- The Others validator rejects the additional obvious placeholders reported by Claude. This remains a form check, not a claim of semantic or academic suitability.
- The frontend consumes shared preference labels, validation-field stages/order, file-purpose/accept/limit descriptors, mode labels and analysis fingerprints. Cache version is `promptwise-v3`.
- Independent verification: 31 Node tests pass; all six branches complete the five screens at 320, 375 and 1440 px; edited copy, saved diagnosis, source-file append/choice handling and conditional format errors pass. Offline refresh and local analysis pass. See `docs/INTEGRATION_REVIEW.md` for evidence and remaining limits.
- Claude's three UX choices (preferences retained on task change, restart confirmation for an edited uncopied draft, and a single-line Others description) remain provisional team choices. Internal AI integration and cancellation support are the next backend milestone; no API calls or report edits were made in this review.

## User feedback and next frontend brief on 10 October 2026

- The user requested clearer future AI wording, broader academic-file support, review of personalisation optionality, sentence fields that wrap/grow, clearer visual grouping, horizontal or instant transitions (superseding the initial vertical proposal), clickable validated step navigation, and an About/credits page relaying Amara's recommendation.
- `docs/UX_REFINEMENT_HANDOFF.md` prepares the next Claude milestone. Keep the current UI design, refine reusable section surfaces, preserve optional personalisation except conditional Other format, allow navigation to completed valid steps and honour reduced motion. The single-line Others input is proposed to become a growing textarea in response to this feedback.
- `docs/ABOUT_CONTENT.md` contains drafted public copy using confirmed names: Luu Quoc Thai Tran, Noah Holt, Angela Liu and Dr Amara Atif. About is an auxiliary page, not a sixth prompt stage. Individual contribution claims, private contact details and unavailable CV/profile links are omitted.
- `docs/ATTACHMENT_PLAN.md` recommends PDF/DOCX/PPTX next, visual context with the AI route, and video later. Current TXT/MD handling remains truthful; broader parsing is not implemented by this planning milestone.
- Current app code remains at the `f3a6acb` implementation. These are handoff documents and proposed design decisions, not completed UI or API features. The original report/contract remain unchanged; publication and paid API use are outside this milestone.

### Footer and navigation clarification on 10 October 2026

- The user's latest instruction replaces vertical screen transitions with horizontal or instant changes matching the step navigation. Normal vertical scrolling within a screen remains available.
- Credits must be an actual website page accessible through a visible About & team link in a compact site footer on every screen. This footer is separate from the existing sticky Continue/action bar. About remains outside the five-step workflow and preserves the student's work when returning.
- The UTS screenshot supplied by the user is inspiration for placing information links at the bottom, not a requirement to reproduce a large institutional footer. The proposed compact footer uses PromptWise branding, working About & team and How it works links, and a student capstone/year line. Full team and supervisor information belongs on About.
- Claude can implement the revised interface brief first using the existing shared interfaces. Codex then reviews the local milestone and proceeds with attachment/backend work and internal AI integration. Take turns editing the checkout; no API or publication is introduced by this clarification.

## Refinement integration review on 10 October 2026

- Claude's interface milestone is `0f530ff`, implementing the revised horizontal navigation, compact footer and actual About page. Codex independently reviewed the checkout and verified six mobile task flows, study layouts at 320/1440 px, step gates, edited copy and About return. See `docs/UX_INTEGRATION_REVIEW.md` for the independent evidence and remaining limits.
- Full local-mode summaries and limitation disclosures now come from `WORKFLOW_MODES[mode].notes.analysis` / `.notes.compare`. Shared personalisation fields now supply `inputKind` (`short`, `sentence`, `material`); the UI no longer keeps its own short-field list. This preserves existing visible behaviour and prepares the shared boundary for a later adapter.
- The cache is now `promptwise-v5`. Isolated Chromium tests verified v3-to-v4 and v4-to-v5 updates, deletion of the previous cache, and offline About/local analysis/draft generation. The 31 Node tests pass after integration; no browser modules, dependencies, API calls or parser support were added.
- The six provisional UX choices can remain in this prototype pending student feedback. Asynchronous cancellation, broader academic materials and internal AI remain subsequent backend work; the report/contract originals are unchanged and nothing is published or pushed.
