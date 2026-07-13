# -*- coding: utf-8 -*-
# הרכבת חוברת וורד מיושרת לימין מקובצי המרקדאון
# תיקון מרכזי: w:bidi חייב לבוא לפני w:jc בתוך w:pPr לפי סדר הסכמה של OOXML,
# אחרת וורד מתעלם מהגדרת הכיווניות וכל המסמך נראה מיושר לשמאל.
import re, glob
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = "/home/user/crm/עבודה-חוברת"
OUT = BASE + "/תוצר/חוברת-מדינה-יהודית-בעלת-תוכן.docx"

FILES = [BASE + "/מבוא/מבוא-מעודכן.md"] + sorted(glob.glob(BASE + "/פרקים/*.md")) + [BASE + "/נספחים.md"]

# האלמנטים שמותר להם לבוא אחרי w:bidi בתוך w:pPr, לפי סדר הסכמה
BIDI_SUCCESSORS = (
    'w:adjustRightInd', 'w:snapToGrid', 'w:spacing', 'w:ind',
    'w:contextualSpacing', 'w:mirrorIndents', 'w:suppressOverlap', 'w:jc',
    'w:textDirection', 'w:textAlignment', 'w:textboxTightWrap',
    'w:outlineLvl', 'w:divId', 'w:cnfStyle', 'w:rPr', 'w:sectPr', 'w:pPrChange',
)

def insert_bidi(pPr):
    bidi = pPr.find(qn('w:bidi'))
    if bidi is None:
        bidi = OxmlElement('w:bidi')
        pPr.insert_element_before(bidi, *BIDI_SUCCESSORS)
    bidi.set(qn('w:val'), '1')
    return bidi

doc = Document()

def set_rtl_style(style, size=None, bold=None):
    style.font.name = "David"
    r = style.element.get_or_add_rPr()
    rf = r.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts'); r.insert(0, rf)
    rf.set(qn('w:ascii'), 'David'); rf.set(qn('w:hAnsi'), 'David'); rf.set(qn('w:cs'), 'David')
    if size:
        style.font.size = Pt(size)
        szCs = r.find(qn('w:szCs'))
        if szCs is None:
            szCs = OxmlElement('w:szCs'); r.append(szCs)
        szCs.set(qn('w:val'), str(int(size * 2)))
    if bold is not None:
        style.font.bold = bold
        if bold:
            bCs = r.find(qn('w:bCs'))
            if bCs is None:
                bCs = OxmlElement('w:bCs'); r.append(bCs)
            bCs.set(qn('w:val'), '1')
    # כיווניות ברמת הסגנון: כל פסקה בסגנון הזה תירש bidi ויישור ימין
    try:
        pPr = style.element.get_or_add_pPr()
        insert_bidi(pPr)
    except AttributeError:
        pass

set_rtl_style(doc.styles['Normal'], size=12)
for h, s in [('Heading 1', 20), ('Heading 2', 16), ('Heading 3', 14), ('Title', 26), ('List Bullet', 12)]:
    try: set_rtl_style(doc.styles[h], size=s, bold=(h != 'List Bullet'))
    except KeyError: pass

def make_rtl(p, align=WD_ALIGN_PARAGRAPH.RIGHT):
    p.alignment = align  # קובע w:jc
    pPr = p._p.get_or_add_pPr()
    insert_bidi(pPr)     # מוכנס לפני w:jc לפי סדר הסכמה
    for run in p.runs:
        rPr = run._r.get_or_add_rPr()
        rtl = rPr.find(qn('w:rtl'))
        if rtl is None:
            rtl = OxmlElement('w:rtl'); rPr.append(rtl)
        rtl.set(qn('w:val'), '1')

def add_runs(p, text):
    # תמיכה בסימון מודגש **טקסט** והמרת סימוני הערות [^n] לסוגריים
    text = re.sub(r'\[\^([^\]]+)\]', r'[\1]', text)
    parts = re.split(r'(\*\*[^*]+\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2]); run.bold = True
            rPr = run._r.get_or_add_rPr()
            bCs = OxmlElement('w:bCs'); bCs.set(qn('w:val'), '1'); rPr.append(bCs)
        elif part:
            p.add_run(part)

def add_paragraph(text, style=None):
    p = doc.add_paragraph(style=style)
    add_runs(p, text)
    make_rtl(p)
    return p

# כיווניות ומספור עמודים ברמת המקטע
section = doc.sections[0]
sectPr = section._sectPr
sec_bidi = OxmlElement('w:bidi')
sectPr.append(sec_bidi)

# כותרת תחתונה: מספר עמוד במרכז (שדה PAGE)
footer_p = section.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
insert_bidi(footer_p._p.get_or_add_pPr())
fld = OxmlElement('w:fldSimple')
fld.set(qn('w:instr'), ' PAGE \\* MERGEFORMAT ')
fr = OxmlElement('w:r')
frPr = OxmlElement('w:rPr')
frf = OxmlElement('w:rFonts')
frf.set(qn('w:ascii'), 'David'); frf.set(qn('w:hAnsi'), 'David'); frf.set(qn('w:cs'), 'David')
frPr.append(frf)
fr.append(frPr)
ft = OxmlElement('w:t'); ft.text = '1'
fr.append(ft)
fld.append(fr)
footer_p._p.append(fld)

# עמוד שער
t = doc.add_paragraph(style='Title'); add_runs(t, 'מדינה יהודית בעלת תוכן'); make_rtl(t, WD_ALIGN_PARAGRAPH.CENTER)
st = doc.add_paragraph(); add_runs(st, 'עשרה מאמרים על זהות, ריבונות ומשפט'); make_rtl(st, WD_ALIGN_PARAGRAPH.CENTER)
st.runs[0].font.size = Pt(16)
doc.add_page_break()

# תוכן עניינים ידני
toc_h = doc.add_paragraph(style='Heading 1'); add_runs(toc_h, 'תוכן העניינים'); make_rtl(toc_h)
toc_items = ['מבוא']
for f in FILES[1:]:
    first = open(f, encoding='utf-8').readline().strip()
    if first.startswith('#'):
        toc_items.append(first.lstrip('#').strip())
for item in toc_items:
    add_paragraph(item)

first_h1 = True
for f in FILES:
    lines = open(f, encoding='utf-8').read().splitlines()
    for line in lines:
        s = line.rstrip()
        if not s.strip():
            continue
        if s.strip() == '---':
            continue
        if s.startswith('### '):
            add_paragraph(s[4:], style='Heading 3')
        elif s.startswith('## '):
            add_paragraph(s[3:], style='Heading 2')
        elif s.startswith('# '):
            doc.add_page_break()
            add_paragraph(s[2:], style='Heading 1')
        elif s.startswith('- '):
            add_paragraph(s[2:], style='List Bullet')
        elif re.match(r'\[\^[^\]]+\]:', s):
            # הערת שוליים: פסקה בגופן קטן
            p = doc.add_paragraph()
            add_runs(p, re.sub(r'^\[\^([^\]]+)\]:', r'[\1]', s))
            for run in p.runs:
                run.font.size = Pt(9)
                rPr = run._r.get_or_add_rPr()
                szCs = OxmlElement('w:szCs'); szCs.set(qn('w:val'), '18'); rPr.append(szCs)
            make_rtl(p)
        else:
            add_paragraph(s)

doc.save(OUT)
print('נשמר:', OUT)

# בקרת איכות
from docx import Document as D2
d = D2(OUT)
content = [p for p in d.paragraphs if p.text.strip()]
bad_bidi, bad_align, bad_order = 0, 0, 0
for p in content:
    pPr = p._p.find(qn('w:pPr'))
    if pPr is None:
        bad_bidi += 1; continue
    children = [c.tag for c in pPr]
    bidi_tag, jc_tag = qn('w:bidi'), qn('w:jc')
    if bidi_tag not in children:
        bad_bidi += 1
    elif jc_tag in children and children.index(bidi_tag) > children.index(jc_tag):
        bad_order += 1
    if p.alignment not in (WD_ALIGN_PARAGRAPH.RIGHT, WD_ALIGN_PARAGRAPH.CENTER):
        bad_align += 1
# בדיקת שדה מספור עמודים בכותרת התחתונה
foot_xml = d.sections[0].footer.paragraphs[0]._p.xml if d.sections[0].footer.paragraphs else ''
has_page_field = 'PAGE' in foot_xml
print('פסקאות עם תוכן:', len(content))
print('חסרות bidi:', bad_bidi, '| bidi אחרי jc (הפרת סדר):', bad_order, '| יישור חריג:', bad_align)
print('שדה מספר עמוד בכותרת תחתונה:', 'קיים' if has_page_field else 'חסר!')
