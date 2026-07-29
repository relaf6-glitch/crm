// עזרים מקומיים: כותרת בלי מספר, וסעיף ממוספר שהמספר בא לפני הטקסט.
const path = require('path');
const SKILL = '/home/user/crm/.claude/skills/quality-contract/scripts';
const B = require(path.join(SKILL, 'build_rtl_docx.js'));
const { Paragraph, AlignmentType, HEAD, r, rn } = B;

// כותרת סעיף בלא מספר. בלי jc מפורש, היישור לימין מגיע מ-bidi.
function hh(text) {
  return new Paragraph({
    bidirectional: true, spacing: { before: 240, after: 70 }, keepNext: true,
    children: [r(text, { bold: true, size: HEAD })],
  });
}

// סעיף ממוספר: המספר לפני גוף הסעיף.
// הספרות בריצת LTR נפרדת, והנקודה והרווחים בריצת RTL, כדי שהנקודה תישאר
// דבוקה למספר ותוצג אחריו ולא לפניו.
function numClause(num, text, bold = false) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 130, line: 288 },
    indent: { start: 624, hanging: 624 },
    children: [rn(String(num)), r('.  '), r(text, { bold })],
  });
}

// תת סעיף באות עברית, כולו בריצת RTL.
function letterItem(letter, text) {
  return new Paragraph({
    bidirectional: true, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 288 },
    indent: { start: 1191, hanging: 567 },
    children: [r('(' + letter + ')  '), r(text)],
  });
}

module.exports = Object.assign({}, B, { hh, numClause, letterItem });
