// Helper for correct right to left tables in Word (for example the client
// questions document). See references/rtl-docx.md.
//
// The key idea: do NOT use visuallyRightToLeft (it clips in LibreOffice).
// Instead reverse the column order manually so the rightmost logical column is
// the first cell, set the table alignment to the right, and use a fixed layout.
//
// Usage sketch:
//   const { rtlTable } = require('./rtl_table');
//   const headers = ['מס\'', 'הסעיף', 'השאלה', 'מדוע', 'השלכות']; // logical, right to left
//   const widths  = [640, 1500, 4720, 4200, 3840];                 // matching logical order
//   const rows = [
//     { cells: ['1', 'סעיף 4', 'שאלה ...', 'כי ...', 'אחרת ...'] },
//     { section: 'א. זהות הצדדים' }, // full width band
//   ];
//   const table = rtlTable(headers, widths, rows);
// Then place `table` in a landscape document (page: 'a4landscape').

const {
  Table, TableRow, TableCell, WidthType, TableLayoutType,
  Paragraph, TextRun, AlignmentType, ShadingType, VerticalAlign, BorderStyle,
} = require('docx');

const FONT = 'Arial';
const BODY = 20;

function cellText(text, { bold, color, align } = {}) {
  return new Paragraph({
    bidirectional: true, alignment: align || AlignmentType.RIGHT,
    spacing: { after: 0, line: 264 },
    children: [new TextRun({ text: String(text), font: FONT, rightToLeft: true, size: BODY, bold: !!bold, color })],
  });
}

function cell(text, { width, bold, fill, color, align, span } = {}) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: span,
    shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [cellText(text, { bold, color, align })],
  });
}

// headers and widths are in logical right to left order; this reverses them to
// visual order internally.
function rtlTable(headers, widths, rows, opts = {}) {
  const n = headers.length;
  const vWidths = [...widths].reverse();
  const headerFill = opts.headerFill || '1F3864';
  const sectionFill = opts.sectionFill || 'D6DCE5';

  const trs = [];
  // header row (reversed to visual order), repeats on each page
  trs.push(new TableRow({
    tableHeader: true,
    children: [...headers].reverse().map((hh, i) => cell(hh, { width: vWidths[i], bold: true, fill: headerFill, color: 'FFFFFF', align: AlignmentType.CENTER })),
  }));

  for (const row of rows) {
    if (row.section) {
      trs.push(new TableRow({ children: [cell(row.section, { span: n, bold: true, fill: sectionFill, align: AlignmentType.RIGHT })] }));
      continue;
    }
    const visual = [...row.cells].reverse();
    trs.push(new TableRow({
      children: visual.map((c, i) => cell(c, {
        width: vWidths[i],
        align: (i === n - 1) ? AlignmentType.CENTER : AlignmentType.RIGHT, // last visual cell is the number column
      })),
    }));
  }

  return new Table({
    width: { size: vWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: vWidths,
    layout: TableLayoutType.FIXED,
    alignment: AlignmentType.RIGHT,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '808080' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '808080' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '808080' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '808080' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'B0B0B0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'B0B0B0' },
    },
    rows: trs,
  });
}

module.exports = { rtlTable, cell, cellText };
