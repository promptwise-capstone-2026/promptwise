# Internal AI scope and evaluation plan

## Supervisor clarification

Recorded on 8 October 2026 from Amara's reply supplied by the user. This is
conditional support for considering internal OpenAI prompt analysis and
rewriting. It is not a guarantee of a mark or a replacement for the assessment
requirements. The conditions are:

- Align the implementation with PromptWise's original objectives and assessment
  requirements.
- Explicitly distinguish internal coaching from automatic submission to an
  external AI tool for completion of the student's academic task.
- Preserve the learning outcomes and demonstrate work beyond a basic interface
  around an existing AI service.

The supplied assignment text does not contain the exact learning-outcome
statements. Map the solution and evidence to those statements when available;
do not invent them or claim that this mapping has already been completed.

## Proposed wording for the updated scope statement

PromptWise supports university students in reviewing and improving their prompts
before using a generative AI tool. An internal OpenAI API may analyse the
original prompt against seven task-aware criteria and rewrite it using the
student's supplied details and optional preferences. The application explains
its findings, supports student review and editing, and compares the original
and improved prompts. It does not automatically submit the improved prompt to
Copilot or another AI tool for completion of the academic task. Students copy
the reviewed prompt and decide how to use it themselves.

The seven criteria remain clarity, context, specificity, constraints, output
format, audience/level and input/source material, using Present, Partial,
Missing and N/A. Tone and response depth remain optional preferences. AI
analysis and rewriting must preserve student intent and distinguish supplied
facts from information still needed. The rewrite must remain a prompt rather
than an answer to the academic task.

The original private report and learning contract are unchanged. Incorporate
this clarification into the team's updated report scope, architecture and
methodology; this local note does not amend a submitted document.

## Current implementation versus planned implementation

- Current: a local rules engine and assembled draft, with task/form validation,
  guidance helpers and in-memory TXT/MD reading. The five-screen frontend is
  wired and reviewed at implementation commit `f3a6acb`. No OpenAI calls or AI
  rewrite have been implemented.
- Planned: genuine internal AI analysis and rewriting through a backend, with
  server-side credentials, validated responses, clear loading/failure states
  and an editable result. The interface must identify which mode produced a
  result. An API failure must not silently present a local draft as AI output.
- Undecided implementation choices: model, API response contract, usage limits,
  PDF/Word/image processing and retention policy for an AI mode. The current
  browser-only handling must not be described as unchanged once selected
  prompt content is sent to the API.
- Still undecided research choice: Copilot-only downstream evaluation versus a
  small comparison of tools. Internal API support does not settle that choice.
- The 10 October attachment proposal and next frontend brief are documented in
  `ATTACHMENT_PLAN.md` and `UX_REFINEMENT_HANDOFF.md`. They describe proposed
  work, not completed capabilities or revised submitted-report requirements.

## Work that demonstrates the project's contribution

These are proposed design and evaluation responsibilities, not an invented
assessment rubric. Document why each decision supports the original aims.

| Area | PromptWise work to implement and explain | Evidence to collect |
| --- | --- | --- |
| Diagnostic framework | Operational definitions for seven criteria, applicability by task, evidence and actionable explanations | Human-labelled cases and examples of correct and incorrect diagnoses |
| Student guidance | Relevant intake and personalisation, source handling, optional preferences and missing-information handling | Examples showing why the additional information changes the rewrite |
| Student agency | Five-screen workflow, understandable findings, editable comparison and manual copying | Observed usability and student understanding, not just successful button clicks |
| Integration | Input/output validation, asynchronous backend, credential handling and recoverable failures | Focused tests and documented failure cases |
| Evaluation | Independent comparison of the original and improved prompts and their downstream results | Recorded protocol, human judgements, limitations and contribution records |

Using an existing model does not require training a new model. The capstone
evidence should explain the team's framework, design, implementation and
findings; API access alone does not demonstrate those contributions.

## Proposed evaluation protocol

1. Assemble a small documented set across all six task branches, including
   vague and detailed prompts, absent sources, contradictory requirements and
   custom Others descriptions. Include unfamiliar or multilingual meaningful
   input to check that simple validation does not reject it as nonsense.
2. Define human judgement guidance using the report's status definitions and
   task applicability. Label the original prompts independently of the app's
   output. Report who reviewed the cases and how disagreements were resolved.
3. Compare the local baseline with AI analysis and rewriting on the same cases.
   Review criterion findings, explanation usefulness, preservation of intent,
   missing information, invented details and whether the rewrite answers the
   task instead of producing a prompt. Record failures as well as successes.
4. Compare original and improved prompts using the same framework. For any
   downstream-output experiment, use the agreed tool and comparable settings,
   supplied sources and task-specific judgement criteria. Record these
   conditions and acknowledge response variability. An AI model's own score
   must not be the sole evidence of improvement.
5. Observe students using the workflow. Collect completion difficulties,
   usefulness of explanations, understanding of why prompts changed, editing
   behaviour and feedback. Do not infer learning from improved prompt text
   alone. Follow the subject's applicable requirements for participant testing.
6. Report sample size, results, limitations, failures, observed latency and API
   usage/cost. No unmeasured improvement, accuracy or performance claim should
   be presented as a result.

## Next milestones

1. Claude completes the agreed frontend milestone using the existing helper
   interfaces; Codex reviews and integrates it.
2. Codex defines the AI backend contract and evaluation instructions from this
   scope, then implements analysis and rewriting with failure handling. Keep
   the local engine as a labelled baseline for comparison.
3. Configure the user's personal API credentials outside Git when live testing
   is ready. Never include a real key in browser code, handoff text or chat.
4. Run live cases and usability evaluation, record evidence and revise the
   report to describe the actual implementation and results.

The learning contract's recorded testing milestone is 9 October, with the draft
report on 16 October and final submission on 23 October. Do not silently change
these dates or claim a future AI milestone has already been completed.
