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

// Automatic bidi safe splitting of Hebrew text that contains numerals.
// Inside an RTL run a numeral is fine on its own, but parentheses mirror and a
// percent sign or a thousands separator drifts, so every numeric token is moved
// into an LTR run of its own. The token must end in a digit, a percent sign or a
// closing parenthesis, so a sentence ending period is never swallowed into the
// LTR run (that is the same defect that renders ".11" instead of "11.").
const NUM_TOKEN = /\(?\d(?:[\d.,:/]*\d)?%?\)?/g;

function splitMixed(text, o = {}) {
  const s = String(text);
  const out = [];
  let last = 0;
  s.replace(NUM_TOKEN, (m, idx) => {
    if (idx > last) out.push(r(s.slice(last, idx), o));
    out.push(rn(m, o));
    last = idx + m.length;
    return m;
  });
  if (last < s.length) out.push(r(s.slice(last), o));
  return out.length ? out : [r(s, o)];
}

// STANDING NUMBERING RULE (same force as the no dashes rule):
// the running number goes on the clause BODY, never on the heading, and the
// period comes AFTER the number ("11." and never ".11").
// The period must never share a run with the digits: digits go in an LTR run of
// their own, and the period plus spacing go in the RTL run that follows. A
// period left inside the digits' LTR run resolves away from them and renders
// before the number.
const START = { 1: 624, 2: 1191, 3: 1815 };

// Numbered clause body. Pass the next integer from counter(): clause(n(), text).
// `text` may be a string, or an array of runs when a numeral or parentheses must
// sit in an LTR run of their own, for example
// r('...ארבעה אחוזים '), rn('(4%)'), r(' מסך...').
// Inside an RTL run parentheses mirror and a percent sign drifts, so keep any
// such token in its own LTR run.
function clause(num, text, level = 1, o = {}) {
  const body = Array.isArray(text) ? text : splitMixed(text, o.run || {});
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 130, line: 288 },
    indent: { start: START[level] || 624, hanging: 624 },
    children: [rn(String(num)), r('.\u00A0\u00A0'), ...body],
  });
}

// Hebrew letter sub item. The parentheses, the letter and the spacing all stay
// inside one RTL run, otherwise they invert.
function letterItem(letter, text, level = 2) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 288 },
    indent: { start: START[level] || 1191, hanging: 567 },
    children: [r('(' + letter + ')\u00A0\u00A0'), ...splitMixed(text)],
  });
}

// Backward compatible wrapper. Digits route to clause(); anything else, such as
// an already formed "(\u05D0)", is treated as a Hebrew letter sub item.
function cl(num, text, level = 1) {
  if (num == null || num === '') {
    return new Paragraph({
      bidirectional: true, alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 288 },
      indent: { start: START[level] || 624, hanging: 624 },
      children: [r(text)],
    });
  }
  const s = String(num);
  if (/^\d+$/.test(s)) return clause(s, text, level);
  return letterItem(s.replace(/[()]/g, ''), text, level === 1 ? 2 : level);
}

// Section heading: bold, unnumbered. No explicit jc; bidi yields right
// alignment and avoids the LibreOffice flip. Accepts h(text), and tolerates the
// legacy h(num, text) form by ignoring the number, since numbers belong on the
// clause body.
function h(text, maybeText) {
  const title = maybeText === undefined ? text : maybeText;
  return new Paragraph({
    bidirectional: true,
    spacing: { before: 240, after: 70 }, keepNext: true,
    children: [r(title, { bold: true, size: HEAD })],
  });
}

// Recital line (הואיל ...).
function recital(text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 110, line: 288 }, indent: { start: 1191, hanging: 1191 },
    children: [r('הואיל ', { bold: true }), ...splitMixed(text)],
  });
}

// Definition line ("term" פירושו ...).
function def(term, text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 288 }, indent: { start: 567, hanging: 567 },
    children: [r('"' + term + '" ', { bold: true }), ...splitMixed('פירושו ' + text)],
  });
}

// Free paragraph.
function p(text, o = {}) {
  return new Paragraph({
    bidirectional: true, alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { after: o.after == null ? 120 : o.after, line: 288 }, indent: o.indent,
    children: Array.isArray(text) ? text : splitMixed(text, o.run || {}),
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

// Two things cannot be expressed through the docx options and are therefore
// patched into the XML on the way out, so no build script has to remember them:
//  1. w:bidi on the section properties. The docx library exposes no section
//     level bidi option at all, and Word on mobile reads the section first.
//  2. removal of an ambiguous w:jc value ("right", "left", "start", "end") from
//     a bidi paragraph. Modern engines read "right" logically as end of line,
//     which in Hebrew is the left edge, and flip the text. Centering and
//     justification are unambiguous and are left untouched.
function patchRtlXml(xml) {
  let out = xml.replace(/<w:jc w:val="(right|left|start|end)"\/>/g, '');
  out = out.replace(/<w:sectPr[^>]*>[\s\S]*?<\/w:sectPr>/g, (s) => {
    if (s.includes('<w:bidi/>') || s.includes('<w:bidi ')) return s;
    return s.includes('<w:docGrid')
      ? s.replace('<w:docGrid', '<w:bidi/><w:docGrid')
      : s.replace('</w:sectPr>', '<w:bidi/></w:sectPr>');
  });
  return out;
}

async function write(doc, path) {
  const fs = require('fs');
  const buf = await Packer.toBuffer(doc);
  let outBuf = buf;
  try {
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('string');
    zip.file('word/document.xml', patchRtlXml(xml));
    outBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  } catch (e) {
    console.warn('RTL XML patch skipped (' + e.message + '). Patch w:bidi on sectPr manually before delivering.');
  }
  fs.writeFileSync(path, outBuf);
  return outBuf.length;
}

module.exports = {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
  FONT, BODY, HEAD, TITLE, PAGE,
  r, rn, cl, clause, letterItem, h, recital, def, p, counter, heb, splitMixed, patchRtlXml, buildDoc, write,
};

// Tiny demo when run directly: node build_rtl_docx.js
// Shows the standing conventions: justified body, unnumbered bold headings with
// the flat running number opening the clause BODY and the period after the
// number, Hebrew letter sub items, and a centered page number footer.
if (require.main === module) {
  const D = [];
  const n = counter();
  D.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [r('הסכם לדוגמה', { bold: true, size: TITLE })] }));
  D.push(h('מבוא'));
  D.push(clause(n(), 'מבוא זה מדגים פסקת גוף ביישור דו צדדי, כך שקצות השורות ישרים בשני הצדדים, והמספר הרץ פותח את גוף הסעיף והנקודה באה אחריו.'));
  D.push(h('הגדרות'));
  D.push(def('הצדדים', 'הבעלים והיזם יחד.'));
  D.push(h('התמורה'));
  D.push(clause(n(), 'התמורה תשולם בשני תשלומים שווים, כמפורט להלן.'));
  D.push(letterItem(heb(1), 'התשלום הראשון במועד החתימה.'));
  D.push(letterItem(heb(2), 'התשלום השני בתוך שלושים יום ממועד הדרישה.'));
  D.push(h('הפרות ותרופות'));
  D.push(clause(n(), 'הצד המפר יפצה את הצד הנפגע בגין כל נזק שנגרם, בנוסף לכל תרופה אחרת על פי דין.'));
  write(buildDoc(D, { page: 'letter', headerText: 'מסמך לדוגמה' }), '/tmp/demo_rtl.docx').then(b => console.log('wrote', b, 'bytes to /tmp/demo_rtl.docx'));
}
