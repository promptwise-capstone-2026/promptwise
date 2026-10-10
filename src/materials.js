export const TEXT_MATERIAL_MAX_BYTES = 1_000_000;
export const TEXT_MATERIAL_ACCEPT = '.txt,.md,text/plain,text/markdown';
export const TEXT_MATERIAL_LIMIT_LABEL = `${TEXT_MATERIAL_MAX_BYTES / 1_000_000} MB`;
export const DOCUMENT_MATERIAL_MAX_BYTES = 10_000_000;
export const MATERIAL_MAX_CHARS = 120_000;
export const DOCUMENT_MATERIAL_ACCEPT = '.txt,.md,.pdf,.docx,.pptx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const MATERIAL_FIELDS = Object.fromEntries(Object.entries({
  source: 'Added to your prompt as the material to work from.',
  code: 'Added to your prompt as the code to explain or debug.',
  draft: 'Added to your prompt as your own draft or notes for feedback.',
  criteria: 'Added to your prompt as the requirements the response should follow.'
}).map(([key, purpose]) => [key, {
  purpose,
  accept: key === 'code' ? TEXT_MATERIAL_ACCEPT : DOCUMENT_MATERIAL_ACCEPT,
  limitLabel: key === 'code' ? '1 MB' : '10 MB for documents; 1 MB for TXT/MD',
  buttonLabel: key === 'code' ? 'Add a TXT or MD code file' : 'Add a PDF, DOCX, PPTX, TXT or MD file',
  supportNote: key === 'code'
    ? 'UTF-8 TXT/MD up to 1 MB. Read in this browser only.'
    : 'PDF, DOCX and PPTX up to 10 MB; TXT/MD up to 1 MB. Read in this browser only. Review the extracted text before adding it. Pictures, diagrams and scanned pages are not interpreted.'
}]));

export class MaterialError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'MaterialError';
    this.code = code;
  }
}

/** Read a user-selected UTF-8 text file in memory. Nothing is uploaded or stored. */
export async function readTextMaterial(file) {
  if (!file || typeof file.name !== 'string' || typeof file.text !== 'function' || !Number.isFinite(file.size) || file.size < 0) {
    throw new MaterialError('invalid_file', 'Choose a text or Markdown file.');
  }
  if (!/\.(?:txt|md)$/i.test(file.name) || (file.type && !['text/plain', 'text/markdown', 'text/x-markdown'].includes(file.type))) {
    throw new MaterialError('unsupported_type', 'Choose a UTF-8 TXT or MD file for this text field. Use a material field for PDF, DOCX or PPTX.');
  }
  if (file.size > TEXT_MATERIAL_MAX_BYTES) {
    throw new MaterialError('too_large', 'Choose a text file no larger than 1 MB, or paste the relevant extract.');
  }
  let content;
  try {
    content = await file.text();
  } catch {
    throw new MaterialError('read_failed', 'This file could not be read. Try another file or paste the relevant extract.');
  }
  if (typeof content !== 'string' || content.includes('\0') || new TextEncoder().encode(content).byteLength > TEXT_MATERIAL_MAX_BYTES) {
    throw new MaterialError('invalid_text', 'Choose a UTF-8 text file within the 1 MB limit.');
  }
  if (!content.trim()) throw new MaterialError('empty_file', 'The selected file is empty. Choose a file containing relevant material.');
  return { name: file.name, text: content, size: file.size };
}

/** Local text extraction only: no upload, AI call, persistent storage or execution of file content. */
export async function readMaterial(file, { signal, field = 'source' } = {}) {
  signal?.throwIfAborted();
  const extension = file?.name?.split('.').pop()?.toLowerCase();
  const textFile = ['txt', 'md'].includes(extension);
  if (field === 'code' && !textFile) throw new MaterialError('unsupported_type', 'Paste code or choose a TXT/MD file. Add related documents in the documentation field.');
  if (textFile) {
    const result = await readTextMaterial(file);
    signal?.throwIfAborted();
    if (result.text.length > MATERIAL_MAX_CHARS) throw new MaterialError('too_much_text', 'Use an extract of at most 120,000 characters.');
    return { ...result, format: extension, warnings: [], reviewRequired: false };
  }
  if (!['pdf', 'docx', 'pptx'].includes(extension)) throw new MaterialError('unsupported_type', 'Choose PDF, DOCX, PPTX, TXT or MD. Images, audio/video and legacy DOC/PPT are not supported; supply relevant text instead.');
  const mime = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }[extension];
  if (file.type && ![mime, 'application/octet-stream', ...(extension === 'pdf' ? [] : ['application/zip'])].includes(file.type)) throw new MaterialError('unsupported_type', 'The file type does not match its extension. Export a fresh PDF, DOCX or PPTX.');
  if (!Number.isFinite(file.size) || file.size < 1 || typeof file.arrayBuffer !== 'function') throw new MaterialError('invalid_file', 'Choose a readable document.');
  if (file.size > DOCUMENT_MATERIAL_MAX_BYTES) throw new MaterialError('too_large', 'Choose a document no larger than 10 MB, or export only the relevant pages or slides.');
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new MaterialError('read_timeout', 'Reading took too long. Export a smaller document or paste the relevant extract.')), 30_000);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    controller.signal.throwIfAborted();
    if (bytes.length !== file.size || bytes.length > DOCUMENT_MATERIAL_MAX_BYTES) throw new MaterialError('invalid_file', 'The document size could not be verified. Choose another file.');
    const { extractDocument } = await import('./document-materials.js');
    controller.signal.throwIfAborted();
    const result = await extractDocument(bytes, extension, controller.signal);
    controller.signal.throwIfAborted();
    return { name: file.name, size: file.size, format: extension, reviewRequired: true, ...result,
      warnings: [...result.warnings, 'Copy includes the reviewed text, not the original file or its pictures. Attach the original material separately in your chosen AI tool if it needs those visuals.'] };
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    if (error instanceof MaterialError) throw error;
    throw new MaterialError('read_failed', 'This document could not be read. It may be damaged or password-protected. Export a fresh PDF/DOCX/PPTX or paste the relevant text.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
