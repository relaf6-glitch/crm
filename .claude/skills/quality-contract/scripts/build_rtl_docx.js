// Reusable helpers for building right to left Hebrew Word documents with the
// `docx` library (version 9+). Require this module and use the helpers, or copy
// them into your build script. Run: `npm install docx` first.
//
// Golden rules baked in here (see references/rtl-docx.md):
//  - every paragraph is bidirectional
//  - every Hebrew run is rightToLeft with an Arial font
//  - numbers / Latin go in a separate run with rightToLeft:false
//  - headings align right, body is justified, clauses use a hanging indent
//  - do NOT force jc="right" alongside bidi; rely on bidi
//  - landscape = set width>height directly, NO orientation field

const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
  Header, Footer, PageNumber,
} = require('docx');

const FONT = 'Arial';
const BODY = 22;      // 11pt
const HEAD = 26;      // 13pt
const TITLE = 34;     // 17pt

// Hebrew run
function r(text, o = {}) {
  return new TextRun({ text: String(text), font: FONT, rightToLeft: true, size: BODY, ...o });
}
// Latin / number run (keeps digits from being reordered inside Hebrew)
function rn(text, o = {}) {
  return new TextRun({ text: String(text), font: FONT, rightToLeft: false, size: BODY, ...o });
}

// Numbered clause with hanging indent. level controls the indent depth.
const START = { 1: 567, 2: 1191, 3: 1815 };
function cl(num, text, level = 1) {
  const kids = [];
  if (num) kids.push(rn(num + '\u00A0\u00A0'));
  kids.push(r(text));
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 288 },
    indent: { start: START[level] || 567, hanging: 567 },
    children: kids,
  });
}

// Section heading, right aligned.
function h(num, text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 260, after: 110 }, keepNext: true,
    children: [rn(num + '.\u00A0\u00A0', { bold: true, size: HEAD }), r(text, { bold: true, size: HEAD })],
  });
}

// Recital line (הואיל ...).
function recital(text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 110, line: 288 }, indent: { start: 1191, hanging: 1191 },
    children: [r('הואיל ', { bold: true }), r(text)],
  });
}

// Definition line ("term" פירושו ...).
function def(term, text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 288 }, indent: { start: 567, hanging: 567 },
    children: [r('"' + term + '" ', { bold: true }), r('פירושו ' + text)],
  });
}

// Free paragraph.
function p(text, o = {}) {
  return new Paragraph({
    bidirectional: true, alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { after: o.after == null ? 120 : o.after, line: 288 }, indent: o.indent,
    children: Array.isArray(text) ? text : [r(text, o.run || {})],
  });
}

// Page sizes. Landscape sets width>height with NO orientation field.
const PAGE = {
  letter: { width: 12240, height: 15840 },
  a4: { width: 11906, height: 16838 },
  a4landscape: { width: 16838, height: 11906 },
};

// Assemble a single section document with header and footer.
function buildDoc(children, opts = {}) {
  const size = PAGE[opts.page || 'letter'];
  const margin = opts.margin || { top: 1440, right: 1440, bottom: 1440, left: 1440 };
  return new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY } } } },
    sections: [{
      properties: { page: { size, margin } },
      headers: opts.headerText ? { default: new Header({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [r(opts.headerText, { size: 16, color: '666666' })] })] }) } : undefined,
      footers: { default: new Footer({ children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [r('עמוד ', { size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT }), r(' מתוך ', { size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: FONT })] })] }) },
      children,
    }],
  });
}

async function write(doc, path) {
  const fs = require('fs');
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path, buf);
  return buf.length;
}

module.exports = {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
  FONT, BODY, HEAD, TITLE, PAGE,
  r, rn, cl, h, recital, def, p, buildDoc, write,
};

// Tiny demo when run directly: node build_rtl_docx.js
if (require.main === module) {
  const D = [];
  D.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [r('הסכם לדוגמה', { bold: true, size: TITLE })] }));
  D.push(h('1', 'מבוא'));
  D.push(cl('1.1', 'זהו סעיף לדוגמה המדגים כתיבה מימין לשמאל עם מספור נכון בסך 1,000 ש"ח.'));
  D.push(def('הצדדים', 'הבעלים והיזם יחד.'));
  write(buildDoc(D, { page: 'letter', headerText: 'מסמך לדוגמה' }), '/tmp/demo_rtl.docx').then(n => console.log('wrote', n, 'bytes to /tmp/demo_rtl.docx'));
}
