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

## Personalisation and document intake correction on 10 October 2026

- The user reported that Study Support had no material control for a general prompt and that TXT/MD-only intake did not meet the intended academic-document workflow. Material availability is now independent of diagnostic activation: all six tasks expose source material, while a general explanation may still correctly have source N/A in its original analysis.
- Reviewed the report's prompt component capture, task-specific branching and optional recommendations. Added visible study lecture materials and optional examples/practice; summary purpose; coding supporting documents/requirements; report readings/case study; presentation brief; and a focused outcome plus instructions for Others. Coding actual-error guidance is recommended for debugging requests; speaker notes and learning preferences remain optional. See `docs/PERSONALISATION_MATERIALS_REVIEW.md` for the complete field matrix.
- Implemented local PDF/DOCX/PPTX text extraction with pinned PDF.js and fflate packages. The reader validates format/size, previews editable extracted text and requires confirmation before use. Multiple documents can be appended one at a time. No file data is uploaded, persisted or sent to AI. Scanned/visual-only documents fail with clear guidance; visual interpretation, images and media remain separate future work.
- Prototype choices: documents 10 MB, TXT/MD 1 MB, 120,000 extracted characters per file, PDF/PPTX 100 pages/slides, Office expansion 20 MB and a 30-second document extraction timeout. These are implementation limits, not report requirements. DOCX includes body/table text and notes; PPTX includes shape/table text and speaker notes. Extraction omissions are disclosed.
- The server explicitly lists generated local parser assets and supports their module MIME type. Service-worker cache is `promptwise-v6`; generated vendor files and installed packages are ignored. Node 22.13+ is required by the selected parser (this Mac already has Node 24). Run npm ci --omit=optional after cloning or dependency updates, then npm run dev.
- The original report/contract and private references remain unchanged. This correction adds document intake and task guidance, not an AI adapter or deployment.

## 10 October — Local AI integration and private GitHub preparation

The user reports a personal OpenAI US$10 top-up and authorises a private GitHub
repository under tlqthai111. Local AI analysis and rewriting are now implemented
behind a server-side key, explicit mode selection and text disclosure. The default
remains local rules. Model snapshot and request limits are implementation choices.
Mock tests do not establish live model quality. Remote AI is disabled pending
hosted access and durable usage controls; a public demo/domain is optional and
not a completed production requirement. See docs/AI_SETUP_AND_RELEASE.md.

### Personal-key live checks — 10 October 2026

User saved the project key locally. Real analysis/rewrite requests succeeded for
all six tasks; calibrated instructions using the report's worked example and
observed failures. Exact-evidence validation rejected an invented quote. AI still
sometimes over-requires material or overlaps criteria; no accuracy claim is made.
Independent evaluation remains necessary. See docs/AI_INTEGRATION_REVIEW.md.

### Practice example loader — 10 October 2026

User-requested addition, rather than an original report requirement. Home now
loads one of 18 synthetic academic scenarios across six tasks, using a shuffled
non-repeating deck per page session. No AI request or automatic consent/action.
Inputs stay editable; replacement of user work requires confirmation. Existing
analysis/draft/files and milestones are cleared on confirmed replacement.
New browser module is allowlisted and cached under promptwise-v8. `npm test`
passes 48/48; focused Chromium checks covered a full deck, six-task coverage,
mode/consent preservation, keyboard activation, replacement cancellation, normal
workflow, responsive Home at 320/375/1440px and offline reload. No paid calls.
Independent AI-quality evaluation remains separate from these demonstration cases.

### Team attribution and accessibility review — 10 October 2026

User supplied the initial member allocation and confirmed shared Design Thinking.
About now explicitly credits Thai with application development and technical
integration, Noah with prompt engineering research, and Angela with UX/student
learning. The report names all three for Existing Tools and Methodology, and
assigns GenAI in Higher Education to Noah; the copy preserves these links.
Responsibility descriptions are not claims that every planned test is completed.
The supplied report's Appendix B remains a contribution-table template; actual
contributions and AI assistance need evidence there. Photos have not yet arrived.

Scoped WCAG 2.2 AA review: 33 axe-core states with zero detected violations,
keyboard workflow and 16 layout/resize/spacing states checked; 48 local tests
pass. Added skip navigation and fixed preference-summary, enlarged-step and
text-spacing/task-card clipping. Cache v9. No formal conformance claim; VoiceOver,
other browsers, real zoom/devices and disabled-user review remain outstanding.
See docs/ACCESSIBILITY_REVIEW.md. Broad desktop UX changes await the user's feedback.

### Desktop layout feedback — 10 October 2026

Applied the user's screenshot feedback: full-width Prompt Input and Your prompt
review, desktop explanation toggles with expanded defaults, comparison field
alignment and grouped copy/restart actions. Mobile defaults remain compact;
actions wrap with available space. Corrected the misleading no-details AI copy.
Cache v10. Local tests 48/48, 61 focused browser assertions, 30 layout states and
nine axe scans (zero detected violations) passed using synthetic/mocked inputs.
No paid requests or push. See docs/DESKTOP_LAYOUT_REVIEW.md for exact coverage,
CSS fallback and outstanding browser/assistive-technology limitations.

### Example emphasis and progress-loss protection — 10 October 2026

User requested yellow example emphasis, restored red restart styling and warnings
before current progress is cleared. Restart now confirms even for copied or
unedited drafts. Conditional native unload protection covers reload/leave while
work exists; browser text is generic and mobile/crash limits remain. Footer states
that progress is in memory only. Cache v11. Existing 48 tests, 25 focused browser
assertions and six axe scans (zero detected violations) passed without paid calls.
See docs/PROGRESS_PROTECTION_REVIEW.md.

The user proposed learning history and a dashboard. The supplied report's Scope
table excludes long-term prompt history/analytics, although the learning objective
supports reflective guidance. docs/LEARNING_DASHBOARD_PROPOSAL.md proposes a
limited opt-in device-only version before accounts, with supportive task-aware
patterns, separate evaluation modes and examples excluded from progress. This is
not implemented or an agreed scope change; team/supervisor discussion remains.
