# Style and register

## No dashes, ever

In all output, Hebrew and otherwise, avoid every kind of dash and hyphen: the
Hebrew מקף, the em dash, and the en dash. Rephrase to avoid them. Examples:

- Instead of a range "5 to 12" written with a dash, write "5 עד 12" or
  "בין 5 לבין 12".
- Instead of a year written with a dash in a statute name, write the parts
  with a space, for example התשל"א 1970.
- Instead of a parenthetical set off with dashes, use commas or parentheses.

Before delivering any document, extract the text and search for em dash, en
dash, and a hyphen sitting between two word characters. If any appear, rewrite.

## Clause numbering, a standing rule of the same force

The number goes **before the clause body, never on the heading**, and the period
comes **after** the number: "11." and never ".11". Treat this exactly as you
treat the no dashes rule.

- The clause title is a bold, unnumbered line. The running number opens the body
  paragraph that follows it:

  ```
  הכספים, ייעודם והשליטה בהם
  7.  כל התרומות שיגויסו בקמפיין יתקבלו בחשבון הבנק של חותם ...
  ```

- **Never put the period inside the digits' run.** Digits go in their own LTR run
  (`rightToLeft: false`) containing digits only; the period and the spacing go in
  the RTL run that follows. A period left inside the LTR run resolves away from
  the digits and renders before the number, producing ".11".
- Numbering is flat (1, 2, 3) through the whole document, never decimal. Sub
  items take Hebrew letters in parentheses, and the parentheses, the letter and
  the spacing all live in a single RTL run, otherwise they invert.
- Cross reference other clauses by their subject, not by number. It keeps the
  numbering free to change and avoids dashes in clause ranges.

Before delivering, confirm in the file structure that every numbered clause is
built from those two runs and that no heading carries a number.

## Legal register

Write confident, declarative legal Hebrew. In the contract, prefer firm,
unhedged formulations over qualified conclusions. Let the analytical force come
from facts and legal reasoning, not from bullet formatting, headers, or rhetoric.
Avoid mechanical or AI sounding constructions and repetitive sentence shapes.

For legal journalism or ideological legal writing, if requested, match a senior
Israeli legal journalist in the long form weekend supplement tradition: analysis
that emerges from narrative rather than imposed on it, no academic jargon, no
over dramatic phrasing.

## Balance and honesty

In analytical work aim for genuine forensic balance: present the strongest form
of each side. Prefer rigorous, self critical methodology over completeness; it
is better to deliver fewer verified results than more unverified ones. Never
present a fabricated citation as authoritative; verify with high confidence or
flag the uncertainty plainly.

## Separation of internal and external

The contract is for the counterparty. Assumptions, open issues, and the legal
audit are internal to the client. Never merge internal reasoning into the
document that goes to the other side.
