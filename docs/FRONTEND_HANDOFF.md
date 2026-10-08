# PromptWise frontend milestone

Work in `/Users/vanln/Developer/promptwise`. This is a local-only repository.
Codex owns the shared logic and eventual AI backend. Claude owns the frontend
and browser interactions. Take turns editing the checkout and make local
milestone commits. Do not push or publish.

## Authority and source material

Read `README.md`, `PROJECT_NOTES.md`, this brief, and the original report,
learning contract, Figma `.fig` and PNGs in `private/references/`. You are
authorised to read the private references; Git ignoring them does not prevent
reading. Never modify or commit them. Put any extracted references in a
scratch directory or inside ignored `private/`.

Use the full Figma evidence where available. A user-provided audit reported
more mobile frames than the six PNG exports, including empty-input and
personalisation states. Inspect the original export or available audit output;
label anything you cannot verify. Do not block the agreed usability work on
missing evidence for a decorative detail.

The report establishes five stages and seven diagnostic criteria. User feedback
adds custom Others input on Home, compact mobile analysis, visual improvements,
attachment intake and required-field indicators. These additions are current
user requests rather than verbatim Figma requirements.

Amara has conditionally supported internal OpenAI analysis and rewriting,
provided the updated scope distinguishes this from automatic downstream task
completion and retains the objectives, assessment requirements and learning
outcomes. See `docs/AI_SCOPE_AND_EVALUATION.md` for the scope and proposed
evaluation plan. The running app still uses local rules. This frontend milestone
must not display simulated AI success or claim semantic judgement from keyword
checks. Codex will implement the actual AI adapter in a subsequent milestone.

## Shared logic available now

These are implemented JavaScript interfaces, not HTTP API endpoints.

```js
import { validateInput, CUSTOM_TASK_MAX_LENGTH } from './validation.js';
import { analyseWorkflow, improveWorkflow } from './workflow.js';
import { readTextMaterial, TEXT_MATERIAL_ACCEPT } from './materials.js';

const input = {
  taskId: 'other',
  original: 'Create interview questions.',
  details: { taskDescription: 'Prepare interviews for a student research project' },
  preferences: {} // optional string values: level, audience, tone, depth, format, otherFormat
};

const validation = validateInput(input, { stage: 'task' });
// { valid, fields: { fieldKey: message }, warnings: string[] }

const analysis = await analyseWorkflow(input);
// { mode: 'local-rules', criteria, fields, warnings }
// criteria: { key, label, status, reason, suggestion }[]
// fields: existing task field descriptors plus criterion, priority and required
// priority is 'recommended' or 'optional'; personalisation fields are optional

const draft = await improveWorkflow(input);
// { mode: 'local-rules', improvedPrompt: string, warnings: string[] }
```

Both workflow functions currently return synchronously; `await` also works
and makes the future async transition straightforward. `WorkflowValidationError`
provides `.fields` for inline errors. This milestone adds no server AI endpoint.

`validateInput` stages are `task`, `analysis` and `generation`. Tasks must be
known, Others needs `details.taskDescription`, the analysis/generation stages
need an original prompt, and generation needs `otherFormat` when format is
Other. Values in details and preferences must be strings. The validator rejects
obvious placeholders, not every meaningless or unsuitable task. A multilingual
or unfamiliar task must not be rejected merely for lacking English keywords.

The 240-character custom-task limit and 1 MB local text-file limit are prototype
implementation choices, not assessment or report requirements.

## Implement the frontend

### Visuals and workflow

- Preserve Home → Prompt Input → Prompt Analysis → Prompt Personalisation →
  Compare the prompts and all six branches.
- Improve spacing, type hierarchy, surfaces, buttons, field feedback and status
  badges. Keep the setup dependency-free and use local assets/system fonts.
- Use readable status text as well as colour, visible keyboard focus and
  comfortable touch targets. Check 375 px mobile and 1440 px desktop layouts.
- On desktop, use available width for explanations and before/after comparison.
- Preserve input through Back navigation and UI rerenders. Avoid replacing a
  focused field on every keystroke. Clear incompatible task details after a
  deliberate task change.

### Home and required fields

- Selecting Others reveals a labelled task-description field on Home.
- Store it as `state.details.taskDescription`, use the shared length limit and
  validate with `validateInput(input, { stage: 'task' })` before Continue.
- Show actionable field errors without losing the entered text. Use warnings
  as guidance rather than silently rejecting valid short descriptions.
- Mark the required task choice, custom Others description, original prompt,
  and conditional Other-format description with a red asterisk and accessible
  required-field information. Explain what the asterisk means.
- Do not mark all seven diagnostic criteria or all personalisation fields as
  mandatory. Tone, depth, audience, level and format choices remain optional.

### Prompt analysis

- Call `analyseWorkflow` when the user requests analysis and retain its result.
- Include the Home custom task in the input. Save the original analysis result;
  later personalisation must not silently replace the initial diagnosis.
- Invalidate an analysis if its original prompt or task changes. Prevent stale
  results from a previous request replacing newer state.
- On mobile show each criterion name and Present/Partial/Missing/N/A status in
  a compact expandable card. Tap and keyboard activation reveal reason and
  suggestion. Desktop may show the full explanations. Hover is supplemental.
- Keep exactly seven criteria. Do not add a score, Tone or Depth as criteria.
- Keep a plain explanation that this mode uses local rules. Local source
  detection cannot establish whether material is complete or relevant.

### Personalisation and text files

- Use `analysis.fields` for task-related inputs. Prioritise recommended fields
  and group optional details separately. Let users review supplied values.
- Do not repeat the Home task-description question. Keep its stored value for
  generation. The shared guidance supplies a source field for source-dependent
  Study Support requests.
- Use the educational options from `LEVELS`. Classmates and tutors belong in
  the separate audience field. Do not silently choose preferences for users.
- For source, code, draft or criteria text areas, offer a user-selected `.txt`
  or `.md` file as an alternative to typing. The field label tells the user
  what the material will be used for.
- Read with `await readTextMaterial(file)` and use `TEXT_MATERIAL_ACCEPT` on
  the input. The return is `{ name, text, size }`; place text into that field.
- Keep file content in session memory. Show filename, reading state and errors.
  Do not discard existing text on a failed read. If a field already contains
  text, offer an explicit append/replace choice. Allow removal/reset.
- Ignore late reads if the user changes file, task or restarts. Render names
  and content as escaped plain text; do not inject markup from a file.
- PDF, Word and image processing is a later milestone. Do not offer a working
  upload for these formats or claim to have analysed their contents yet.

### Comparison

- Validate generation through `improveWorkflow`, then display its draft in an
  editable text area. Show loading/error/retry states around the async boundary
  while retaining the user's original and preferences on failure.
- In local mode describe the result as a locally assembled draft. Do not call
  it an AI rewrite. The planned AI rewrite will use a server implementation.
- Show missing-source warnings and the responsible-use reminder. Do not block
  a draft that explicitly asks for unknown source material to be supplied.
- Copy the student's edited value, not a previous generated string. Reject an
  empty copy with useful feedback. Retain manual copying to the downstream tool.

## Ownership and verification

Frontend changes belong in `src/app.js`, `src/styles.css`, `index.html`, local
visual assets and `sw.js`. Shared modules (`tasks`, `rules`, `validation`,
`guidance`, `workflow`, `materials`), server scripts and existing domain tests
belong to Codex. Record a needed shared-interface change for the handoff rather
than duplicating its logic in the UI.

Update the service-worker version and cache list for newly imported modules so
offline use does not retain the previous bundle. Never cache private files or
future API responses.

Run `npm test` (23 tests at this handoff). Browser-check all six branches,
blank/placeholder Others input, a meaningful Others description, original input
errors, expandable cards, keyboard navigation, Back preservation, custom format
validation, text-file read/error/removal, editable copy and restart. Confirm no
horizontal overflow on mobile and usable desktop comparison. Test refresh and
service-worker updates so the review sees the current version.

Make one meaningful local frontend commit. Finish with its ID, changed files,
actual verification results and integration issues. Write findings in
`docs/FRONTEND_REVIEW.md`; leave the private sources intact.
