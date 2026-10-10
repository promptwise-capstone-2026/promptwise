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

- Completed baseline: five screens, all six task branches, transparent local rules,
  editable comparison, accessible About navigation and browser extraction of
  TXT/MD/PDF/DOCX/PPTX text. Scans, images, diagrams and video are not interpreted.
- Implemented for local testing on 10 October: server-side OpenAI Responses
  adapter for seven-criterion analysis and rewriting, structured output and
  response validation, explicit mode selection and data disclosure, error handling,
  request cancellation, input/output limits and an attempts allowance.
- Personal-key connectivity, latency and usage were checked on 10 October with
  synthetic examples across all six tasks and one real browser flow. Calibration
  found unresolved judgement errors; independent effectiveness evaluation remains
  open. See AI_INTEGRATION_REVIEW.md for results and limitations. Mock integration
  results and calibration examples are not independent model-effectiveness evidence.
- The trial model is `gpt-4.1-mini-2025-04-14`, a configurable implementation
  choice rather than a report requirement or a claim that it is the best model.
- Only accepted text is sent when an AI action is selected after agreement.
  Original files remain in the browser. Server code does not persist prompt
  content. `store: false` is requested; provider retention policies still apply.
- Remote AI access is disabled for this milestone. Hosted AI requires authenticated
  access, durable usage controls, operational checks and accurate privacy copy.
  A public demo is an optional extension; the supplied report lists a
  production-ready public deployment out of scope.
- The user authorised a private GitHub repository under `tlqthai111` on 10 October.
  Actual remote/upload status must be checked rather than inferred from this note.
- Still undecided research choice: Copilot-only downstream evaluation versus a
  small comparison of tools. Internal API support does not settle that choice.

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

1. Completed: personal project key configured outside Git, with small synthetic
   live API checks. Recorded tokens, latency and failures; no private references sent.
2. Collect independent diagnostic and rewrite judgements and student usability
   evidence using the protocol above. Keep the labelled local engine for comparison.
3. Finish private GitHub backup and CI verification; prepare a hosted demo only
   after choosing its access and cost controls. A custom domain can follow later.
4. Update the report's scope, architecture, methods, actual results and limitations.

The learning contract's testing milestone was 9 October, with the draft report
on 16 October and final submission on 23 October. Do not silently change these
dates or describe integration/calibration checks as completed independent AI evaluation.
