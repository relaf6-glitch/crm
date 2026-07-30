# Building right to left Hebrew Word documents

These documents are unforgiving. Follow this exactly, and use
`scripts/build_rtl_docx.js` for the helpers.

## Environment

- Use the `docx` npm library (version 9 or later) with Node. Install if needed:
  `npm install docx`.
- Build with `node build.js`, then always:
  - validate: `python /mnt/skills/public/docx/scripts/office/validate.py <file>` (path may differ outside this environment; if absent, skip).
  - render one page to confirm right alignment: convert to PDF with LibreOffice
    (`soffice --headless --convert-to pdf <file>`), then `pdftoppm -jpeg -r 90 -f 1 -l 1 file.pdf out` and view the image.
  - read the text back for a dash check: `extract-text <file>` or `pandoc`.

## Standing formatting conventions

These are fixed defaults for every document, unless the user overrides them:

- **Body text is justified** (`AlignmentType.JUSTIFIED`, יישור דו צדדי), so both
  edges of the paragraph are straight. Headings stay right aligned.
- **Flat running numbering.** Number the main clauses with a single running
  integer sequence that runs through the whole agreement: 1, 2, 3, and so on.
  Do NOT use decimal numbering such as 1.1, 1.2, 2.1. Use one `counter()` from
  `build_rtl_docx.js` for the whole document. Sub items inside a clause, when
  needed, take Hebrew letters in parentheses, (א), (ב), (ג), via the `heb()`
  helper, not a second number.
- **The number goes on the clause body, not on the heading, and the period
  follows the number.** Use `h(title)` for the bold unnumbered heading and
  `clause(n(), text)` for the numbered body. This is a standing rule with the
  same force as the no dashes rule.
- **The period must never share a run with the digits.** `clause()` builds the
  paragraph from an LTR run holding digits only, followed by an RTL run holding
  the period and the spacing, then the RTL text run. If the period is left in the
  digits' LTR run it resolves away from them and renders as ".11". Hebrew letter
  sub items (`letterItem()`) keep the parentheses, the letter and the spacing in
  a single RTL run for the same reason.
- **Page numbers at the bottom, centered.** `buildDoc` already adds a centered
  footer field (עמוד X מתוך Y). Keep it on every document.

## What the module now enforces for you

Three things used to need remembering on every build and are now automatic in
`build_rtl_docx.js`. Do not hand roll them again:

- **Numerals inside Hebrew prose.** `splitMixed()` runs inside `clause()`, `p()`,
  `recital()`, `def()` and `letterItem()`, so a plain string such as
  `'ארבעה אחוזים (4%) מסך התרומות'` already comes out with `(4%)` in its own LTR
  run. The token pattern must end in a digit, a percent sign or a closing
  parenthesis, so a sentence ending period is never absorbed. Passing an array of
  runs still works when you want manual control.
- **`w:bidi` on the section properties.** The docx library exposes no section
  level bidi option, so `write()` injects it into the XML on the way out.
- **Ambiguous `w:jc`.** `write()` strips `right`, `left`, `start` and `end` from
  every paragraph, leaving `center` and `both` untouched.

`write()` needs `jszip`, which ships as a dependency of `docx`. If it cannot be
loaded, `write()` prints a warning and skips the patch, and you must then inject
`w:bidi` on the sectPr yourself before delivering.

## Core RTL rules for body text

- Every paragraph needs `bidirectional: true`.
- Every text run needs `rightToLeft: true` and a Hebrew safe font, usually
  `Arial` (or `David` if asked).
- Put numbers and any Latin content in a **separate run** with
  `rightToLeft: false`, so digits do not get reordered inside Hebrew.
- Headings align right (`AlignmentType.RIGHT`); body paragraphs are justified
  (`AlignmentType.JUSTIFIED`); numbered clauses use a hanging indent
  `indent: { start, hanging }` so the clause number sits to the right. Clause
  numbers are flat running integers (1, 2, 3), never decimal (see the standing
  conventions above).

## The two traps that waste the most time

1. **Do not set an explicit right alignment together with bidi on the same
   paragraph.** In LibreOffice a paragraph that carries both `bidi` and an
   explicit `jc="right"` renders flipped to the left. Rely on `bidi` at the
   paragraph level and at the section (sectPr) level, and let alignment be
   right or justified as above without forcing `jc="right"` in raw XML. When you
   build with the `docx` library and set `alignment: AlignmentType.RIGHT` plus
   `bidirectional: true`, it renders correctly; the trap is mainly when hand
   writing XML.

2. **Always verify actual right alignment on a rendered page before
   delivering.** Do not trust the code; render and look, or measure the pixel
   position of the text edges.

## Page setup

- Portrait Letter: `size: { width: 12240, height: 15840 }`.
- Portrait A4: `size: { width: 11906, height: 16838 }`.
- **Landscape: set the width and height directly with width greater than
  height, and do NOT include an `orientation` field.** Passing the orientation
  enum causes the library to swap width and height and you end up in portrait.
  Landscape A4 is `size: { width: 16838, height: 11906 }`.

## Tables (for example the client questions document)

Right to left tables are the hardest part.

- **Do not use `visuallyRightToLeft: true` on the table.** In LibreOffice it
  clips content and pushes the first column off the page edge.
- Instead **reverse the column order manually**: the rightmost logical column
  becomes the first cell in each row, and the leftmost logical column becomes
  the last. Build the header row and every data row in this reversed visual
  order, and reverse the column widths array to match.
- Set the table `alignment: AlignmentType.RIGHT` so it anchors to the right
  margin with any slack on the left.
- Use `layout: TableLayoutType.FIXED` with an explicit `columnWidths` array.
- Each cell paragraph is `bidirectional: true` with right or center alignment;
  each run is `rightToLeft: true`, font Arial.
- A section header row spanning all columns is one cell with `columnSpan` equal
  to the number of columns.
- Keep the total table width a little under the usable page width so nothing
  clips at the edge.

## Dash check

Before delivering, confirm there are no dashes anywhere. Extract the text and
grep for em dash, en dash, and hyphen between word characters. Rephrase to
remove any that appear. See `style.md`.

## Delivering

Copy the final file to the output directory and present it. For a formal
deliverable use docx; for lighter internal notes markdown is fine. Offer a PDF
if useful.
