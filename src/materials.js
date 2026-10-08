export const TEXT_MATERIAL_MAX_BYTES = 1_000_000;
export const TEXT_MATERIAL_ACCEPT = '.txt,.md,text/plain,text/markdown';

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
    throw new MaterialError('unsupported_type', 'Local file reading currently supports .txt and .md files. PDF, Word and image reading are planned separately.');
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
