import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectOfficeArchive } from '../src/document-materials.js';
import { docxFixture, pptxFixture } from './document-fixtures.mjs';

test('Office preflight selects text parts and excludes media/header content', () => {
  const docx = inspectOfficeArchive(docxFixture(), 'docx');
  assert.ok(docx.selected.has('word/document.xml'));
  assert.ok(docx.selected.has('word/footnotes.xml'));
  assert.ok(!docx.selected.has('word/header1.xml'));
  const pptx = inspectOfficeArchive(pptxFixture(), 'pptx');
  assert.ok(pptx.selected.has('ppt/notesSlides/notesSlide1.xml'));
  assert.ok(pptx.selected.has('ppt/_rels/presentation.xml.rels'));
});

test('Office preflight rejects wrong formats, unsafe paths, encryption and expansion bombs', () => {
  assert.throws(() => inspectOfficeArchive(docxFixture(), 'pptx'));
  assert.throws(() => inspectOfficeArchive(docxFixture({ extra: { '../escape.xml': 'no' } }), 'docx'));
  const bytes = docxFixture();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const central = bytes.findIndex((_, i) => i + 4 <= bytes.length && view.getUint32(i, true) === 0x02014b50);
  const encrypted = bytes.slice(); new DataView(encrypted.buffer).setUint16(central + 8, 1, true);
  assert.throws(() => inspectOfficeArchive(encrypted, 'docx'));
  const bomb = bytes.slice(); new DataView(bomb.buffer).setUint32(central + 24, 30_000_000, true);
  assert.throws(() => inspectOfficeArchive(bomb, 'docx'), error => error.code === 'expanded_too_large');
});
