#!/usr/bin/env python3
"""
Fix Hebrew text in an SVG for rasterizers that do not apply the bidirectional
algorithm (such as cairosvg), then optionally write a one page PDF.

Why: cairosvg renders Hebrew glyphs but does not reorder mixed Hebrew and
number or parenthesis strings, so a label like "תשלום (24 חודשים)" comes out
scrambled. This script reorders each Hebrew text run into visual order with
python-bidi and removes direction="rtl", so the rasterizer draws it correctly.

The input SVG should contain plain Hebrew in logical order (correct for
browsers). The output "visual" SVG is for cairosvg only; do not open it in a
browser (it would be double reordered).

Usage:
  python fix_bidi_svg.py input.svg output_visual.svg [output.pdf]

Requires: python-bidi, cairosvg  (pip install python-bidi cairosvg)
Assumes each <text> element holds plain text with no child <tspan> elements.
"""
import re
import sys


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out_svg = sys.argv[1], sys.argv[2]
    out_pdf = sys.argv[3] if len(sys.argv) > 3 else None

    from bidi.algorithm import get_display

    svg = open(src, encoding="utf-8").read()

    def fix(m):
        opentag, content = m.group(1), m.group(2)
        opentag = opentag.replace(' direction="rtl"', "")
        if re.search(r"[\u0590-\u05FF]", content):  # contains Hebrew
            content = get_display(content)
        return opentag + content + "</text>"

    fixed = re.sub(r"(<text\b[^>]*>)([^<]*)(</text>)", fix, svg)
    open(out_svg, "w", encoding="utf-8").write(fixed)
    print("wrote", out_svg)

    if out_pdf:
        import cairosvg
        cairosvg.svg2pdf(url=out_svg, write_to=out_pdf)
        print("wrote", out_pdf)


if __name__ == "__main__":
    main()
