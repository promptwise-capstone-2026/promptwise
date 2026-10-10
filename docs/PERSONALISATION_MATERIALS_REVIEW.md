# Personalisation and academic materials review

Implemented on 10 October 2026 after the user identified a gap in Study Support
and requested working academic-file intake across tasks.

## Evidence and decisions

The supplied report requires relevant context, constraints, source material,
audience and response format, with task-specific branching and optional,
editable guidance (FR2, UR5/UR6 and sections 3.3/3.3.1). The report's study branch
also names current knowledge, course level, explanation preference and examples.
The seven criteria remain unchanged; tone, depth and examples are optional
preferences. The user's latest feedback makes material input available even
when the initial local diagnosis marks source N/A. Parser choice, file limits
and field ordering below are implementation decisions, not added assessment
requirements or evidence that the evaluator has been scientifically validated.

The previous Study Support implementation only added a source field if local
keyword checks activated the source criterion. A general request such as
"Explain phishing" therefore had no attachment control. That gate is removed.
An optional source field does not by itself make source material mandatory or
change the saved original diagnosis.

## Task field matrix

Shared response preferences remain educational level, audience, output format,
tone and depth. Each task also retains an optional real-requirements field.
Only the existing conditional Other-format description is mandatory here.

| Task | Task details | Material inputs |
| --- | --- | --- |
| Study Support | Subject/context; question or focus (name the page/slide); current knowledge; optional examples/practice | Visible lecture slides/notes/source; optional study question or assessment instructions |
| Summarisation | Summary purpose; focus; target length | Visible material to summarise |
| Coding Assistance | Language/framework; expected goal; actual behaviour/error (recommended when debugging) | Visible code (TXT/MD or paste); visible related documentation/learning material; optional coding requirements |
| Report Writing | Report question/purpose; what to preserve when revising | Visible readings/case study; visible own draft/notes; assignment guide/rubric/template |
| Presentation Preparation | Topic/key message; duration/slide count; optional speaker-note needs | Visible notes/evidence or existing slide text; optional presentation brief/criteria |
| Others | Existing Home description is reused; relevant context; specific question/outcome | Visible source; optional task/assessment instructions |

Material inputs stay visible even when optional, except additional instructions
which can use the existing optional disclosure unless recommended. The UI still
shows each field once and uses shared labels, input kinds and material descriptors.
No separate mandatory tone, depth, examples or source requirement is introduced.
Lecture-slide/page references now activate a missing-source warning, while a
general study explanation can remain N/A. Supplied assessment instructions now
count toward constraints in the local rules.

## Actual file support

- PDF: selectable text labelled by page. Images/scans are not OCR'd. A fully
  image-only file is rejected; pages without text are disclosed. Reading order,
  equations and visual interpretation are not guaranteed.
- DOCX: body paragraphs, table cell text, footnotes/endnotes and inserted
  revisions. Deleted revisions, headers/footers, comments, pictures and embedded
  objects are omitted. Text is shown as a document extract, without page claims.
- PPTX: slide-shape/table text and speaker notes in presentation order, labelled
  by slide. Charts, SmartArt, hidden-slide status, pictures and layout are not
  interpreted. Empty-text slides are disclosed; fully visual files are rejected.
- TXT/MD: existing UTF-8 text reader, with the extracted-text limit also applied.
- Code fields accept TXT/MD or pasted code; PDFs and Office documents belong in
  the separate related-document field.
- Images, audio/video, legacy DOC/PPT and password-protected documents do not
  receive fabricated text. Use an accessible extract or describe the relevant
  visual. Vision/OCR/media support remains future work.

PDF.js 6.4.299 (Apache-2.0) and fflate 0.8.3 (MIT) are pinned in package-lock.json.
Parser modules, worker, CMaps and standard fonts are prepared from installed
packages and served locally through an exact generated asset allowlist. No CDN,
AI or backend file upload is used. Generated files and dependencies stay ignored.
Node 22.13+ is required; the Mac already has Node 24.

## Review and data flow

1. Choose a relevant file. Validate extension/MIME, magic/package structure and
   resource limits before using it. Office reads only selected XML parts and
   checks expanded size, paths, local headers, size/CRC and XML validity.
2. Extract text in browser memory. Cancel reading, a task switch or restart
   aborts pending document work; stale results cannot replace newer input.
3. For PDF/DOCX/PPTX, show an editable preview with attribution and extraction
   limits. The student keeps relevant passages and explicitly chooses Use this
   text, Replace or Add below. Creating a draft waits for this decision.
4. Further files can be added one at a time. Remove the latest inserted text or
   edit the field; an edited passage is not silently deleted. Failed reads keep
   existing material intact. No extracted text is silently truncated.
5. The final editable prompt includes the accepted text. Compare repeats the
   extraction/copy limitations. Copy does not transfer original files, images
   or diagrams into Copilot or another tool.

Prototype limits: documents 10 MB; TXT/MD 1 MB; 120,000 extracted characters per
file; PDF/PPTX 100 pages/slides; Office expansion 20 MB, 2 MB per selected XML
part, 2,000 archive entries; document timeout 30 seconds. Export a smaller relevant
extract when a limit is reached. These are local prototype choices.

## Verification

See the verification addendum below for the final actual run. The harness and
screenshots live outside Git in /private/tmp/promptwise-materials-20261010/.

## Remaining limits

Text extraction is not semantic understanding or proof of complete coverage.
No real student usability study, Safari/Firefox, phone, screen-reader or live AI
verification is claimed. The original documents are unchanged. Future AI work
must review the selected material and privacy/mode wording separately.

## Parser references

- [PDF.js document loading and extraction API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)
- [fflate ZIP APIs](https://github.com/101arrowz/fflate)

### Verification addendum — final run

- Actual project `npm test`: 37/37 pass; `git diff --check` clean. The tests
  include existing six-branch/seven-criterion behaviour, new always-available
  material fields, format/size/cancellation validation, malformed Office
  archives, expansion/encryption/path checks and the exact static asset
  allowlist with module MIME types. The two pinned installed packages report
  zero vulnerabilities in the install-time npm audit.
- Isolated headless Chromium: 24 focused check groups pass. Actual PDF, DOCX
  and PPTX fixtures extract their known text; tables, Word notes/revisions,
  presentation order and speaker notes are checked. Fully image-only PDF,
  malformed/DTD content and empty previews fail clearly. HTML-like text is
  inert. All six tasks show material input once, await preview confirmation
  and carry accepted text into the draft.
- Appending documents, removing the latest text, cancelling a read, retaining
  earlier material after failure, and 320/1440 px layouts pass. No online
  console/runtime errors. Offline refresh followed by PDF/DOCX/PPTX intake
  passes; v6 caches 204 approved paths including local parser dependencies,
  with no private files or node_modules URLs.
- Canonical app smoke check at http://127.0.0.1:4173: the restarted server serves
  the new parser modules. Study Support accepts a PPTX even for the general
  original prompt "Explain phishing". The reviewed extract reaches the draft;
  edited copy still matches exactly. Browser checks also verify an inert script
  string in the preview and rejection of a deliberately incorrect Office CRC.
  Final mobile/desktop material-control screenshots were inspected.
- All nine private reference hashes match the earlier baseline and remain
  ignored. Dependencies, generated parser bundles and binary document fixtures
  are not staged; fixture generators are source files. No API calls or uploads
  were introduced. Safari/Firefox, real devices, screen readers, password-file
  handling with a real encrypted fixture and complex diagram/SmartArt coverage
  remain unverified; the app does not claim visual understanding.
