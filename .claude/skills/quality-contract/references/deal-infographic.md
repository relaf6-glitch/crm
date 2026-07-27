# One page deal infographic

Goal: a single page that maps the whole deal at a glance, suitable to print
beside the agreement.

## Structure that works

- A header band with the deal title and a one line subtitle.
- A row of party cards (in right to left order, the primary party on the right),
  with short arrows and labels showing the relationships between them.
- A prominent money flow strip for the headline payment.
- An asset transformation band (current state, an arrow, the planned result).
- Two boxes side by side for the money mechanics, for example the profit split
  with a dilution note, and a sale waterfall.
- A horizontal timeline of milestones (in right to left order, the first
  milestone on the right, the arrow pointing left).
- A footer row of key figure chips and a short disclaimer that the graphic is
  illustrative and the signed contract governs.

Use a restrained palette (a deep navy, a gold accent, light gray cards, green
for money, red for risk or penalty). Keep to one page.

## The critical rendering trap

Build the SVG with plain Hebrew text in logical order for viewing in a browser.
But an SVG rasterizer such as cairosvg does not apply the bidirectional
algorithm, so any string that mixes Hebrew with numbers or parentheses (for
example a timeline label like "תשלום (24 חודשים)") comes out scrambled, with
words appearing on top of or inside the wrong place. This is the classic
"words on words" bug.

Fix it by processing the SVG through the bidi helper before converting to PDF:

```
python scripts/fix_bidi_svg.py deal_map.svg deal_map_visual.svg deal_map.pdf
```

The helper reorders each Hebrew text run into visual order with python-bidi and
removes `direction="rtl"`, so cairosvg renders it correctly, then writes a one
page PDF. The logical order SVG is for browsers; the processed SVG and the PDF
are the correct print deliverables.

## Verify

Render the final PDF back to an image (`pdftoppm -jpeg -r 130 deal_map.pdf out`)
and look at it. Confirm every word sits in its box, nothing overlaps, and no
mixed string is scrambled. Only then deliver.
