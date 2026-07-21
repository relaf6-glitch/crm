# הפקת וורד עברי מיושר

## הכלל הקבוע, וההסבר מאחוריו

בפסקת עברית RTL **אין להשתמש ב-`w:jc="right"`**. הסיבה נלמדה בפועל: מנועי תצוגה
מודרניים (וורד בנייד, גוגל דוקס, והפרשנות ה"קפדנית" של OOXML) קוראים את הערך
"right" באופן **לוגי** כ"end", וקצה השורה בכתיבה מימין לשמאל הוא הצד **השמאלי**.
לכן `jc="right"` בפסקת RTL מקפיץ את הטקסט שמאלה. וורד למחשב הישן פירש "right"
כימין פיזי, ולכן בדיקה מולו "עברה" בעוד שבנייד הטקסט נראה שמאלי.

**הפתרון:** פסקה מסומנת RTL ב-`w:bidi` בלבד. פסקת RTL נצמדת מאליה לתחילת השורה,
שהיא הצד הימני, וכל המנועים מסכימים על כך. `w:jc` מפורש שמור רק ל:
- **מרכוז** (`center`), שאין בו עמימות ימין/שמאל.
- **יישור דו-צדדי** (`both`, justify), ערך חד-משמעי הבטוח בכל מנוע.

בנוסף, מסמנים RTL גם ברמת ברירת המחדל של המסמך (`docDefaults`), כי וורד בנייד
קורא אותה תחילה.

הערה: "ג'יבריש" חולף לכמה שניות בפתיחה בוורד בנייד הוא עיכוב טעינת גופן, לא באג
בקובץ. הוא מתייצב מעצמו.

## המודול

כל זה מקודד ב-`scripts/rtl_docx.py`. הפונקציות:

- `apply_base_styles(doc, [(style_name, size), ...])` — גופן David ו-RTL לסגנונות.
- `set_doc_defaults_rtl(doc)` — bidi/rtl בברירת המחדל של המסמך (חשוב לנייד).
- `set_section_rtl(section)` — כיווניות המקטע.
- `add_page_number_footer(section)` — שדה PAGE ממורכז בתחתית.
- `make_rtl(p, center=False, align=None)` — מסמן פסקה RTL. `center=True` לכותרות;
  אחרת יישור לפי `BODY_ALIGN` ('both' דו-צדדי כברירת מחדל, או 'right' טבעי).
- `qa_report(path)` — שער יציאה. מחזיר `paragraphs, no_bidi, ambiguous_jc,
  page_field`. תקין = `no_bidi=0, ambiguous_jc=0, page_field=True`.

`BODY_ALIGN` בראש המודול שולט ביישור הגוף לכל הקבצים.

## תבנית הפקה מלאה

```python
import re, sys
sys.path.insert(0, "<skill>/scripts")
from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from rtl_docx import (apply_base_styles, make_rtl, set_section_rtl,
                      set_doc_defaults_rtl, add_page_number_footer, qa_report)

doc = Document()
apply_base_styles(doc, [('Heading 1', 20), ('Heading 2', 16), ('Heading 3', 14)])
set_doc_defaults_rtl(doc)
set_section_rtl(doc.sections[0])
add_page_number_footer(doc.sections[0])

def add_runs(p, text):
    text = re.sub(r'\[\^([^\]]+)\]', r'[\1]', text)          # הערות: [^n] -> [n]
    for part in re.split(r'(\*\*[^*]+\*\*)', text):          # **מודגש**
        if part.startswith('**') and part.endswith('**'):
            r = p.add_run(part[2:-2]); r.bold = True
            bCs = OxmlElement('w:bCs'); bCs.set(qn('w:val'), '1')
            r._r.get_or_add_rPr().append(bCs)                # bold-complex-script לעברית
        elif part:
            p.add_run(part)

def add_paragraph(text, style=None, center=False):
    p = doc.add_paragraph(style=style); add_runs(p, text); make_rtl(p, center=center); return p

for line in open(src, encoding='utf-8').read().splitlines():
    s = line.rstrip()
    if not s.strip() or s.strip() == '---': continue
    if   s.startswith('### '): add_paragraph(s[4:], style='Heading 3', center=True)
    elif s.startswith('## '):  add_paragraph(s[3:], style='Heading 2', center=True)
    elif s.startswith('# '):   add_paragraph(s[2:], style='Heading 1', center=True)
    elif re.match(r'\[\^[^\]]+\]:', s):                       # הגדרת הערת שוליים בגופן קטן
        p = doc.add_paragraph()
        add_runs(p, re.sub(r'^\[\^([^\]]+)\]:', r'[\1]', s))
        for r in p.runs: r.font.size = Pt(9)
        make_rtl(p)
    else: add_paragraph(s)

doc.save(out)
print(qa_report(out))
```

## הערות שוליים: לפי אופי העבודה

אופן ההפקה נקבע לפי אופי העבודה. שתי אפשרויות:

- **הערות מספרות בסוף כל פרק, בגופן קטן** (כמו בתבנית למעלה): פשוט ויציב,
  ההפניה `[n]` בגוף וההגדרות כפסקאות קטנות בסוף הפרק.
- **הערות שוליים אמיתיות של וורד** (בתחתית העמוד, מספור אוטומטי): מקצועי יותר,
  אך מורכב יותר להפקה ב-python-docx.

במקרה של ספק, שאל את המחבר איזו מהשתיים מתאימה למסמך.

## נקודות שכדאי לזכור

- **מודגש בעברית** דורש גם `w:bCs` (bold complex script), לא רק `bold=True`,
  אחרת ההדגשה לא נראית. המודול והתבנית מטפלים בזה.
- כותרות: `center=True`. תוכן עניינים, שער, מספרי עמודים: ממורכזים אף הם.
- הרץ `qa_report` אחרי כל בנייה. אם אינו נקי, הקובץ פסול, תקן ובנה מחדש.
- אם צריך לצלם את התוצאה לאימות ויזואלי, ייתכן שכלי ההמרה (LibreOffice) לא יעבוד
  בסביבה. במקרה כזה, האימות הוודאי הוא פתיחה במכשיר של המחבר; אפשר גם לבדוק את
  ה-XML (`document.xml`) לוודא bidi נוכח ואין jc עמום.
