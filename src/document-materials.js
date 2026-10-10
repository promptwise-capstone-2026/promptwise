import { MaterialError, MATERIAL_MAX_CHARS } from './materials.js';

const ARCHIVE_MAX_BYTES = 20_000_000;
const XML_MAX_BYTES = 2_000_000;
const utf8 = new TextDecoder('utf-8', { fatal: true });
const abortError = () => new DOMException('Reading cancelled.', 'AbortError');
const tooLarge = () => new MaterialError('too_much_text', 'This document contains too much text. Export only the relevant pages or slides (up to 120,000 characters).');
const malformed = () => new MaterialError('invalid_document', 'This is not a readable PDF, DOCX or PPTX document. Export a fresh copy or paste the relevant text.');
const elements = (node, name) => [...node.getElementsByTagNameNS('*', name)];
const attr = (node, name) => [...node.attributes].find(a => a.localName === name)?.value;
function xml(bytes) {
  const text = utf8.decode(bytes);
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw malformed();
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (elements(doc, 'parsererror').length) throw malformed();
  return doc;
}
function checkedText(text) {
  if (text.length > MATERIAL_MAX_CHARS) throw tooLarge();
  return text;
}

// Check the central directory before decompressing. Only selected XML parts are read.
// This bounds declared expansion, rejects encryption/ZIP64 and prevents duplicate/path aliases.
export function inspectOfficeArchive(bytes, format) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) throw malformed();
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) {
    if (view.getUint32(p, true) === 0x06054b50 && p + 22 + view.getUint16(p + 20, true) === bytes.length) { end = p; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw malformed();
  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  let position = view.getUint32(end + 16, true);
  if (!count || count > 2000 || view.getUint16(end + 8, true) !== count || position + directorySize !== end) throw malformed();
  const selected = new Map();
  const names = new Set();
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || view.getUint32(position, true) !== 0x02014b50) throw malformed();
    const flags = view.getUint16(position + 8, true);
    const method = view.getUint16(position + 10, true);
    const compressed = view.getUint32(position + 20, true);
    const size = view.getUint32(position + 24, true);
    const nameLength = view.getUint16(position + 28, true);
    const extraLength = view.getUint16(position + 30, true);
    const commentLength = view.getUint16(position + 32, true);
    const offset = view.getUint32(position + 42, true);
    if (position + 46 + nameLength + extraLength + commentLength > end || flags & 1 || ![0, 8].includes(method) || compressed === 0xffffffff || size === 0xffffffff || offset >= end) throw malformed();
    const name = utf8.decode(bytes.subarray(position + 46, position + 46 + nameLength));
    if (names.has(name) || name.startsWith('/') || name.includes('\\') || name.split('/').some(x => x === '..' || x === '.')) throw malformed();
    names.add(name);
    total += size;
    if (total > ARCHIVE_MAX_BYTES) throw new MaterialError('expanded_too_large', 'The document expands beyond the 20 MB reading limit. Export a smaller document or only the relevant slides.');
    const wanted = name === '[Content_Types].xml' || (format === 'docx'
      ? /^word\/(?:document|footnotes|endnotes)\.xml$/.test(name)
      : /^ppt\/(?:presentation\.xml|_rels\/presentation\.xml\.rels|slides\/slide\d+\.xml|slides\/_rels\/slide\d+\.xml\.rels|notesSlides\/notesSlide\d+\.xml)$/.test(name));
    if (wanted) {
      if (size > XML_MAX_BYTES) throw new MaterialError('part_too_large', 'A document section is too large to read. Export a smaller extract.');
      // Verify the local header agrees with the central directory before giving it to the ZIP reader.
      if (offset + 30 > bytes.length || view.getUint32(offset, true) !== 0x04034b50 || view.getUint16(offset + 6, true) & 1) throw malformed();
      const localNameLength = view.getUint16(offset + 26, true);
      const localExtraLength = view.getUint16(offset + 28, true);
      const start = offset + 30 + localNameLength + localExtraLength;
      if (start + compressed > end || utf8.decode(bytes.subarray(offset + 30, offset + 30 + localNameLength)) !== name || view.getUint16(offset + 8, true) !== method) throw malformed();
      selected.set(name, { size, crc: view.getUint32(position + 16, true) });
    }
    position += 46 + nameLength + extraLength + commentLength;
  }
  if (position !== end || !names.has('[Content_Types].xml') || !names.has(format === 'docx' ? 'word/document.xml' : 'ppt/presentation.xml')) throw malformed();
  return { selected, names };
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

async function unpack(bytes, selected, signal) {
  const { unzip } = await import('/public/vendor/fflate.mjs');
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    let terminate;
    const abort = () => { terminate?.(); reject(signal.reason || abortError()); };
    signal?.addEventListener('abort', abort, { once: true });
    terminate = unzip(bytes, { filter: file => selected.has(file.name) && file.originalSize === selected.get(file.name).size }, (error, files) => {
      signal?.removeEventListener('abort', abort);
      if (signal?.aborted) return reject(signal.reason || abortError());
      if (error) return reject(malformed());
      for (const [name, expected] of selected) {
        if (!files[name] || files[name].length !== expected.size || crc32(files[name]) !== expected.crc) return reject(malformed());
      }
      resolve(files);
    });
  });
}

function paragraph(node) {
  let text = '';
  const walk = current => {
    if (current.nodeType !== 1 || current.localName === 'del') return;
    if (current.localName === 't') text += current.textContent;
    else if (current.localName === 'tab') text += '\t';
    else if (['br', 'cr'].includes(current.localName)) text += '\n';
    else for (const child of current.children) walk(child);
  };
  walk(node);
  return text.trim();
}

function wordText(root) {
  const blocks = [];
  for (const child of root.children) {
    if (child.localName === 'p') blocks.push(paragraph(child));
    else if (child.localName === 'tbl') {
      for (const row of [...child.children].filter(n => n.localName === 'tr')) {
        blocks.push([...row.children].filter(n => n.localName === 'tc').map(cell => wordText(cell).replace(/\n+/g, ' / ')).join(' | '));
      }
    } else if (!['sectPr', 'del'].includes(child.localName)) blocks.push(wordText(child));
  }
  return blocks.filter(Boolean).join('\n');
}

function related(files, name) {
  const doc = files[name] && xml(files[name]);
  return doc ? elements(doc, 'Relationship').filter(n => n.getAttribute('TargetMode') !== 'External') : [];
}
function resolvePart(base, target) {
  const path = new URL(target, 'https://local.invalid/' + base).pathname.slice(1);
  if (!path.startsWith('ppt/')) throw malformed();
  return path;
}
function slideText(doc, notes = false) {
  const shapes = elements(doc, 'sp').filter(shape => {
    const type = elements(shape, 'ph')[0]?.getAttribute('type');
    return !['sldNum', 'dt', 'ftr', 'hdr'].includes(type) && (!notes || type !== 'sldImg');
  }).map(shape => elements(shape, 'p').map(paragraph).filter(Boolean).join('\n')).filter(Boolean);
  const tables = elements(doc, 'tbl').map(table => elements(table, 'tr').map(row => [...row.children].filter(n => n.localName === 'tc').map(cell => elements(cell, 'p').map(paragraph).filter(Boolean).join(' / ')).join(' | ')).join('\n'));
  return [...shapes, ...tables].filter(Boolean).join('\n');
}

async function office(bytes, format, signal) {
  const { selected, names } = inspectOfficeArchive(bytes, format);
  const files = await unpack(bytes, selected, signal);
  signal?.throwIfAborted();
  const types = xml(files['[Content_Types].xml']);
  const expectedType = format === 'docx' ? 'wordprocessingml.document.main+xml' : 'presentationml.presentation.main+xml';
  if (!elements(types, 'Override').some(node => (node.getAttribute('ContentType') || '').endsWith(expectedType))) throw malformed();
  const warnings = ['Only extracted text is included. Pictures, diagrams, layout and embedded objects are not interpreted. Review the preview and keep the passages relevant to your question.'];
  const sections = [];
  let usable = false;
  if (format === 'docx') {
    const doc = xml(files['word/document.xml']);
    const body = elements(doc, 'body')[0];
    if (!body) throw malformed();
    const bodyText = wordText(body);
    usable = Boolean(bodyText.trim());
    sections.push('[Document text]\n' + bodyText);
    for (const kind of ['footnotes', 'endnotes']) {
      if (files[`word/${kind}.xml`]) {
        const notes = elements(xml(files[`word/${kind}.xml`]), kind.slice(0, -1)).filter(node => Number(attr(node, 'id')) > 0).map(wordText).filter(Boolean);
        if (notes.length) { usable = true; sections.push(`[${kind}]\n${notes.join('\n')}`); }
      }
    }
    warnings.push('DOCX includes body paragraphs, table cell text and footnotes/endnotes. Headers, footers, comments and deleted revisions are omitted; inserted revisions are included.');
  } else {
    const presentation = xml(files['ppt/presentation.xml']);
    const links = related(files, 'ppt/_rels/presentation.xml.rels');
    const ids = elements(presentation, 'sldId');
    if (!ids.length || ids.length > 100) throw new MaterialError('slide_limit', 'Choose a presentation with 1–100 slides, or export the relevant slides.');
    for (const [index, id] of ids.entries()) {
      signal?.throwIfAborted();
      const relationId = [...id.attributes].find(a => a.localName === 'id' && a.namespaceURI)?.value;
      const relation = links.find(n => n.getAttribute('Id') === relationId);
      if (!relation) throw malformed();
      const path = resolvePart('ppt/presentation.xml', relation.getAttribute('Target'));
      if (!files[path]) throw malformed();
      const text = slideText(xml(files[path]));
      const notesLink = related(files, path.replace(/([^/]+)$/, '_rels/$1.rels')).find(n => /\/notesSlide$/.test(n.getAttribute('Type') || ''));
      let notes = '';
      if (notesLink) {
        const notesPath = resolvePart(path, notesLink.getAttribute('Target'));
        if (!files[notesPath]) throw malformed();
        notes = slideText(xml(files[notesPath]), true);
      }
      sections.push(`[Slide ${index + 1}]\n${text || '[No selectable slide text]'}${notes ? '\n[Speaker notes]\n' + notes : ''}`);
      if (text || notes) usable = true;
      if (!text && !notes) warnings.push(`Slide ${index + 1} has no extractable text; its visual content was not read.`);
      checkedText(sections.join('\n\n'));
    }
    warnings.push('PPTX includes text in slide shapes, table cells and speaker notes in presentation order. Chart labels, SmartArt, hidden-slide status and images are not interpreted.');
  }
  if (!usable) throw new MaterialError('visual_only', 'No usable text was found. This document may contain pictures or scanned pages. Paste the relevant text or describe the visual content; it has not been read.');
  return { text: checkedText(sections.join('\n\n')), warnings, format };
}

async function pdf(bytes, signal) {
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw malformed();
  const pdfjs = await import('/public/vendor/pdf.mjs');
  signal?.throwIfAborted();
  pdfjs.GlobalWorkerOptions.workerSrc = '/public/vendor/pdf.worker.mjs';
  const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, enableXfa: false, stopAtErrors: true, useWasm: false,
    cMapUrl: '/public/vendor/cmaps/', standardFontDataUrl: '/public/vendor/standard_fonts/', verbosity: 0 });
  const abort = () => { task.destroy().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const document = await task.promise;
    if (document.numPages > 100) throw new MaterialError('page_limit', 'Choose a PDF with at most 100 pages, or export only the relevant pages.');
    const sections = [];
    const warnings = ['PDF includes selectable page text only. Scans, diagrams, pictures, equations and layout are not interpreted. Reading order may differ; check the preview.'];
    let usable = false;
    for (let number = 1; number <= document.numPages; number++) {
      signal?.throwIfAborted();
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      const text = content.items.map(item => typeof item.str === 'string' ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim();
      page.cleanup();
      if (text) usable = true;
      else warnings.push(`Page ${number} has no selectable text. Its visual content was not read.`);
      sections.push(`[Page ${number}]\n${text || '[No selectable text on this page]'}`);
      checkedText(sections.join('\n\n'));
    }
    if (!usable) throw new MaterialError('visual_only', 'No selectable PDF text was found. This may be a scanned or image-only PDF. Paste an accessible text extract or describe the relevant content; the pages have not been interpreted.');
    return { text: sections.join('\n\n'), warnings, format: 'pdf' };
  } catch (error) {
    if (signal?.aborted) throw signal.reason || abortError();
    if (error.name === 'PasswordException') throw new MaterialError('password_protected', 'Password-protected PDFs cannot be read. Export an unlocked copy or paste the relevant text.');
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    await task.destroy().catch(() => {});
  }
}

export async function extractDocument(bytes, format, signal) {
  return format === 'pdf' ? pdf(bytes, signal) : office(bytes, format, signal);
}
