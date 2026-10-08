import test from 'node:test';
import assert from 'node:assert/strict';
import { readTextMaterial, MaterialError, TEXT_MATERIAL_MAX_BYTES } from '../src/materials.js';

const file = (name, content, overrides = {}) => ({ name, size: new TextEncoder().encode(content).byteLength, type: 'text/plain', text: async () => content, ...overrides });
const hasCode = code => error => error instanceof MaterialError && error.code === code;

test('text material preserves user-supplied content, including code and markup as plain text', async () => {
  const content = '# Lecture notes\n<script>alert("example")</script>\nThông tin về bài học';
  const result = await readTextMaterial(file('notes.MD', content, { type: 'text/markdown' }));
  assert.equal(result.name, 'notes.MD');
  assert.equal(result.text, content);
});

test('unsupported documents, spoofed MIME types and oversized files fail before reading', async () => {
  let reads = 0;
  const text = async () => { reads += 1; return 'data'; };
  await assert.rejects(readTextMaterial(file('report.pdf', 'data', { text })), hasCode('unsupported_type'));
  await assert.rejects(readTextMaterial(file('notes.txt', 'data', { type: 'application/pdf', text })), hasCode('unsupported_type'));
  await assert.rejects(readTextMaterial(file('notes.txt', 'data', { size: TEXT_MATERIAL_MAX_BYTES + 1, text })), hasCode('too_large'));
  assert.equal(reads, 0);
});

test('empty, binary and unreadable material produce actionable errors', async () => {
  await assert.rejects(readTextMaterial(file('notes.txt', '  \n')), hasCode('empty_file'));
  await assert.rejects(readTextMaterial(file('notes.txt', 'a\0b')), hasCode('invalid_text'));
  await assert.rejects(readTextMaterial(file('notes.txt', 'data', { text: async () => { throw new Error('I/O'); } })), hasCode('read_failed'));
});
