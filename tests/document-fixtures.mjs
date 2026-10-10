import { zipSync, strToU8 } from 'fflate';
const pack = files => zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
const types = (extension, part) => `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/${part}" ContentType="application/vnd.openxmlformats-officedocument.${extension}"/></Types>`;
export function docxFixture({ text = 'Lecture context: phishing messages impersonate a trusted sender.', extra = {} } = {}) {
  return pack({
    '[Content_Types].xml': types('wordprocessingml.document.main+xml', 'word/document.xml'),
    'word/document.xml': `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Term</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Phishing</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:del><w:r><w:t>DELETED SHOULD NOT APPEAR</w:t></w:r></w:del><w:ins><w:r><w:t>Inserted revision</w:t></w:r></w:ins></w:p></w:body></w:document>`,
    'word/footnotes.xml': '<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote w:id="1"><w:p><w:r><w:t>Footnote source</w:t></w:r></w:p></w:footnote></w:footnotes>',
    'word/header1.xml': '<ignored>OMITTED HEADER</ignored>',
    ...extra
  });
}
const shape = text => `<p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
export function pptxFixture() {
  const ns = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
  return pack({
    '[Content_Types].xml': types('presentationml.presentation.main+xml', 'ppt/presentation.xml'),
    'ppt/presentation.xml': '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId1"/></p:sldIdLst></p:presentation>',
    'ppt/_rels/presentation.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
    'ppt/slides/slide1.xml': `<p:sld ${ns}><p:cSld><p:spTree>${shape('SECOND presented slide: practise spotting phishing.')}</p:spTree></p:cSld></p:sld>`,
    'ppt/slides/slide2.xml': `<p:sld ${ns}><p:cSld><p:spTree>${shape('FIRST presented slide: phishing is social engineering.')}<p:graphicFrame><a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>Slide table cell</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></p:graphicFrame></p:spTree></p:cSld></p:sld>`,
    'ppt/slides/_rels/slide2.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="n1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/></Relationships>',
    'ppt/notesSlides/notesSlide1.xml': `<p:notes ${ns}><p:cSld><p:spTree>${shape('Speaker notes: discuss deceptive links.')}</p:spTree></p:cSld></p:notes>`
  });
}
export function pdfFixture({ blank = false } = {}) {
  const content = blank ? '' : 'BT /F1 12 Tf 40 160 Td (Lecture slide: phishing uses deceptive messages.) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];
  let data = '%PDF-1.4\n'; const offsets = [0];
  for (const [index, object] of objects.entries()) { offsets.push(data.length); data += `${index + 1} 0 obj\n${object}\nendobj\n`; }
  const start = data.length;
  data += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new TextEncoder().encode(data);
}
