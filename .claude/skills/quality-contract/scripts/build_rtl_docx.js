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

// Running sequential numbering (1, 2, 3 ...), NOT decimal (1.1, 1.2). Every
// main clause takes the next integer from one counter that runs through the
// whole agreement. Usage: const n = counter(); h(n(), 'מבוא'); h(n(), 'הגדרות').
function counter(start = 1) {
  let i = start - 1;
  return () => String(++i);
}

// Hebrew letter for a sub item inside a clause (flat numbering keeps a single
// running integer for clauses; sub items use letters, not a second number).
// heb(1) => 'א', heb(2) => 'ב'. Use as cl('(' + heb(k) + ')', text, 2).
const _HEB = 'אבגדהוזחטיכלמנסעפצקרשת';
function heb(i) { return _HEB[(i - 1) % _HEB.length]; }

// Numbered clause with hanging indent. level controls the indent depth.
// For the running scheme pass a single integer at level 1 (n()), and Hebrew
// letters at level 2 for sub items; avoid decimal numbers such as "1.1".
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
  r, rn, cl, h, recital, def, p, counter, heb, buildDoc, write,
};

// Tiny demo when run directly: node build_rtl_docx.js
// Shows the standing conventions: justified body, flat running numbering
// (1, 2, 3 ...) with Hebrew letter sub items, and a centered page number footer.
if (require.main === module) {
  const D = [];
  const n = counter();
  D.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [r('הסכם לדוגמה', { bold: true, size: TITLE })] }));
  D.push(h(n(), 'מבוא'));
  D.push(p('מבוא זה מדגים פסקת גוף ביישור דו צדדי, כך שקצות השורות ישרים בשני הצדדים, בעברית מלאה מימין לשמאל, וכל הסכום נקוב במספרים תקינים בסך 1,000,000 ש"ח.'));
  D.push(h(n(), 'הגדרות'));
  D.push(def('הצדדים', 'הבעלים והיזם יחד.'));
  D.push(h(n(), 'התמורה'));
  D.push(cl('(' + heb(1) + ')', 'התמורה תשולם בשני תשלומים שווים.', 2));
  D.push(cl('(' + heb(2) + ')', 'כל תשלום ישולם בתוך שלושים יום ממועד הדרישה.', 2));
  D.push(h(n(), 'הפרות ותרופות'));
  D.push(p('הצד המפר יפצה את הצד הנפגע בגין כל נזק שנגרם, בנוסף לכל תרופה אחרת על פי דין.'));
  write(buildDoc(D, { page: 'letter', headerText: 'מסמך לדוגמה' }), '/tmp/demo_rtl.docx').then(b => console.log('wrote', b, 'bytes to /tmp/demo_rtl.docx'));
}
