# PromptWise attachment support plan

Proposed on 10 October 2026 in response to the user's request. This is a scoped
design plan, not a claim of implemented support or a new report requirement.
Codex owns this backend work; the frontend refinement preserves current TXT/MD.

## Recommended support

| Material | Intended use | Recommended stage |
| --- | --- | --- |
| TXT/MD | Pasted text, notes, code or requirements | Already implemented locally |
| PDF | Assignment guides, case studies, lecture notes | Next attachment/backend milestone |
| DOCX | Drafts, report templates and rubrics | Next attachment/backend milestone; text first |
| PPTX | Lecture slide text and speaker notes where supported | Next attachment/backend milestone; text first |
| PNG/JPEG | Diagrams, screenshots and visual context | With a verified vision-capable AI route |
| Video/audio | Recorded teaching or demonstrations | Later extension; accept a transcript through current text input first |

Support modern DOCX/PPTX first; legacy DOC/PPT, password-protected files and
corrupt files require an actionable unsupported/error state. Do not silently
claim they were read. Users can export a relevant document or slide deck to PDF
when diagrams matter, or supply relevant screenshots.

## Proposed flow

1. Select relevant files in the Materials and requirements section. Associate
   each with its purpose: source, assignment requirements, draft/template or
   code. Support several relevant files eventually rather than one arbitrary
   catch-all attachment; counts and size limits will be prototype choices.
2. Validate supported formats and size/content limits on the server as well as
   the client. Keep names escaped. Document extracted content is data, not
   authority to override the PromptWise evaluator's instructions.
3. Preview the usable material before it is included. For extracted text, show
   a readable, editable excerpt with its filename and page/slide/section
   attribution where the parser provides it. For visual material, show the
   actual selected image/page and identify that it will be processed visually.
4. Tell the student about extraction limits, unreadable pages or omitted visuals.
   Let them choose relevant excerpts/pages/slides. Do not silently truncate the
   document and then imply the whole file was evaluated.
5. Include only selected material in analysis/rewriting after the user invokes
   the relevant action. Merely selecting a file must not start a paid AI call.
   Preserve the original-prompt diagnosis; label any later review with added
   material as a separate review rather than overwriting the original evidence.
6. Keep session attachments separate from private project references. Explain
   which content is sent to OpenAI and implement an explicit retention/deletion
   policy. Never promise browser-only processing for an API file route.
7. The final prompt includes the relevant excerpt or a clear instruction to
   attach the same material in the downstream tool. A file attached to
   PromptWise does not automatically accompany copied text into Copilot.

## Implementation approach to decide in the backend milestone

**Preferred text path:** deterministic extraction for DOCX/PPTX and text-based
PDF, followed by a student-reviewed text preview. Reuse the extracted context
for AI rewriting rather than paying the model to process the whole document
on every navigation or retry. Select maintained parsers after reviewing their
format coverage, licensing, resource limits and fit with the local Node setup.
This work will need parsing dependencies; the existing dependency-free shell
does not itself read these formats.

**Visual path:** use the eventual vision-capable model for selected images or
PDF pages when diagrams/scans matter. Empty text extraction is not proof that a
PDF is empty. Show that visual processing is needed rather than returning a
false success. OCR/visual interpretation requires separate evaluation.

**Simpler alternative for an initial AI demo:** pass approved files directly to
OpenAI Responses through the backend, if this is compatible with the chosen
model, cost and privacy design. Current official documentation supports DOCX
and PPTX text inputs, while vision-capable PDF processing includes text and page
images. Non-PDF document input does not include embedded images/charts; it is
not equivalent to viewing the full slide or Word page. Do not promise local
editable extraction previews when the chosen route only forwards the file.

[OpenAI file-input documentation](https://developers.openai.com/api/docs/guides/file-inputs)

Video would add media decoding, transcription, optional frame extraction,
timestamp attribution and substantially more material to review. It is a
separate feature. A transcript is a useful first step but cannot represent
everything visible in the original recording.

## Decisions still to make before implementation

- Parser and model selection; supported PDF scan/diagram behaviour.
- Maximum file count, file size, extracted text/page/slide limits and budget.
- Whether slide speaker notes and Word tables/comments are included; preview
  must accurately reflect each parser's coverage.
- Session/provider retention, temporary-file cleanup and removal behaviour.
- Shared attachment data contract and error states. No endpoint or schema is
  declared implemented by this plan.

## Verification evidence needed

Use small non-private fixtures containing known text, tables and diagram-only
pages/slides. Check extraction omissions, corrupt/locked/oversized input,
removal, multiple files, stale reads, prompt-injection text, selected excerpts
and recovery after failure. Check copied prompts do not imply that downstream
Copilot received the original attachment. Test model interpretation separately
from parser success; a successful upload does not prove understanding.
