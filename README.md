# 🚀 CRM Pro — מערכת ניהול לקוחות מקצועית

מערכת CRM מלאה בעברית לניהול לקוחות, משימות, פגישות ותזכורות.

---

## 📋 תוכן עניינים

- [דרישות מערכת](#דרישות-מערכת)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [התקנה מהירה](#התקנה-מהירה)
- [הגדרת סביבה](#הגדרת-סביבה)
- [הרצת הפרויקט](#הרצת-הפרויקט)
- [נתוני Demo](#נתוני-demo)
- [מסכים ותכונות](#מסכים-ותכונות)
- [Stack טכנולוגי](#stack-טכנולוגי)
- [API Routes](#api-routes)
- [Deployment](#deployment)

---

## 📌 דרישות מערכת

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14

---

## 🗂 מבנה הפרויקט

```
crm/
├── app/
│   ├── (auth)/
│   │   └── login/              # דף התחברות
│   ├── (app)/
│   │   ├── layout.tsx          # Layout עם Sidebar + Topbar
│   │   ├── dashboard/          # דשבורד ראשי
│   │   ├── clients/            # ניהול לקוחות
│   │   │   └── [id]/           # כרטיס לקוח
│   │   ├── tasks/              # ניהול משימות
│   │   ├── calendar/           # יומן פגישות
│   │   ├── reminders/          # תזכורות
│   │   ├── documents/          # מסמכים
│   │   └── settings/           # הגדרות
│   ├── api/
│   │   ├── auth/[...nextauth]/ # Authentication
│   │   ├── clients/            # CRUD לקוחות
│   │   ├── tasks/              # CRUD משימות
│   │   ├── meetings/           # CRUD פגישות
│   │   ├── reminders/          # CRUD תזכורות
│   │   ├── notes/              # הערות
│   │   ├── tags/               # תגים
│   │   ├── documents/          # מסמכים
│   │   └── dashboard/          # סטטיסטיקות
│   ├── layout.tsx              # Root layout (RTL, fonts)
│   └── globals.css             # Global styles
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx         # Sidebar עם navigation
│   │   └── topbar.tsx          # Topbar עם search ו-notifications
│   ├── dashboard/
│   │   └── dashboard-client.tsx
│   ├── clients/
│   │   ├── client-form-dialog.tsx
│   │   └── client-detail-client.tsx
│   ├── tasks/
│   │   └── task-form-dialog.tsx
│   ├── calendar/
│   │   └── meeting-form-dialog.tsx
│   ├── reminders/
│   │   └── reminder-form-dialog.tsx
│   └── providers.tsx           # Session + Theme providers
│
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth configuration
│   └── utils.ts                # Utilities + translations
│
├── store/
│   └── app-store.ts            # Zustand global state
│
├── types/
│   └── next-auth.d.ts          # Type extensions
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data בעברית
│
├── .env.example                # Environment variables template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ התקנה מהירה

### שלב 1 — שכפול והתקנת תלויות

```bash
# שכפל את הפרויקט
git clone <repo-url>
cd crm

# התקן תלויות
npm install
```

### שלב 2 — הגדרת סביבה

```bash
# העתק קובץ הגדרות
cp .env.example .env.local

# ערוך את .env.local עם הפרטים שלך
```

### שלב 3 — הגדרת מסד הנתונים

```bash
# ודא ש-PostgreSQL פועל ויצר מסד נתונים:
createdb crm_db

# או עם psql:
psql -U postgres -c "CREATE DATABASE crm_db;"

# הפעל Prisma migrations
npm run db:push

# טען נתוני demo
npm run db:seed
```

### שלב 4 — הפעלה

```bash
npm run dev
```

פתח את [http://localhost:3000](http://localhost:3000) בדפדפן.

---

## 🔧 הגדרת סביבה

ערוך את `.env.local`:

```env
# חובה
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/crm_db"
NEXTAUTH_SECRET="your-secret-key"  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

לייצור NEXTAUTH_SECRET חזק:
```bash
openssl rand -base64 32
```

---

## 🏃 הרצת הפרויקט

```bash
# פיתוח
npm run dev

# בנייה לייצור
npm run build
npm run start

# ניהול מסד נתונים
npm run db:studio    # פתח Prisma Studio
npm run db:seed      # טען נתוני demo
npm run db:reset     # אפס מסד נתונים + נתוני demo
npm run db:migrate   # הפעל migrations חדשים
```

---

## 👥 נתוני Demo

לאחר הרצת `npm run db:seed`:

| תפקיד | אימייל | סיסמה |
|-------|--------|-------|
| מנהל מערכת | admin@demo.com | admin123 |
| משתמש רגיל | user@demo.com | user123 |

הנתונים כוללים:
- **10 לקוחות** עם סטטוסים שונים, תגים, וקשר אחרון
- **10 משימות** בעדיפויות ומצבים שונים (כולל משימות שפגו)
- **6 פגישות** — עתידיות ועברות
- **5 תזכורות** — כולל תזכורות על לקוחות ומשימות
- **5 הערות** על לקוחות שונים
- **לוג פעילות** מפורט

---

## 🖥 מסכים ותכונות

### 📊 דשבורד
- כרטיסי סטטיסטיקה (לקוחות, משימות, פגישות)
- גרף חודשי של לקוחות חדשים ומשימות שהושלמו
- עוגת מצב משימות
- פגישות קרובות (7 ימים)
- לקוחות ללא קשר 30+ יום
- פעילות אחרונה

### 👥 ניהול לקוחות
- **תצוגת Grid** — כרטיסים חזותיים
- **תצוגת טבלה** — מידע מרוכז
- חיפוש לפי שם, טלפון, אימייל, חברה
- פילטור לפי סטטוס ועדיפות
- כרטיס לקוח מלא עם 6 טאבים:
  - סקירה + פעילות אחרונה
  - משימות קשורות
  - פגישות
  - הערות (עם הוספה מהירה)
  - מסמכים
  - תזכורות
- יצירה / עריכה / מחיקה

### ✅ ניהול משימות
- **תצוגת Kanban** — 4 עמודות (לביצוע / בתהליך / הושלם / בוטל)
- **תצוגת רשימה** — מרוכז עם סינון
- פילטור לפי סטטוס, עדיפות, חיפוש חופשי
- הדגשת משימות שפגו (אדום) ודחופות
- סימון משימה כהושלמה ישירות מהרשימה

### 📅 יומן פגישות
- FullCalendar מלא עם תצוגת חודש / שבוע / יום
- לחיצה על תאריך — פתיחת טופס פגישה חדשה
- לחיצה על פגישה — פאנל פרטים עם עריכה ומחיקה
- 8 צבעים לסוגי פגישות שונים
- שיוך לקוח, מיקום, תיאור

### 🔔 תזכורות
- פילטר: הכל / לא נקראו / קרובות
- הדגשת תזכורות שעבר מועדן (אדום)
- פעולות: סמן כנקרא / בטל / מחק
- קיצורי זמן מהירים (שעה / מחר / שבוע)

### 📁 מסמכים
- גריד קבצים חזותי
- Drag & Drop להעלאה
- תמיכה ב-PDF, Word, תמונות
- תצוגת overlay עם הורדה ומחיקה

### ⚙️ הגדרות
- פרופיל משתמש
- ערכת צבעים (בהיר / כהה / מערכת)
- ניהול התראות עם toggle switches
- שינוי סיסמה
- ייצוא נתונים וגיבוי

---

## 🛠 Stack טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | NextAuth v4 |
| Styling | Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Calendar | FullCalendar |
| Notifications | Sonner |
| Font | Heebo (Hebrew) |

---

## 🔌 API Routes

| Method | Route | תיאור |
|--------|-------|-------|
| GET/POST | `/api/clients` | רשימת לקוחות / יצירה |
| GET/PUT/DELETE | `/api/clients/[id]` | לקוח ספציפי |
| GET/POST | `/api/tasks` | משימות / יצירה |
| GET/PUT/DELETE | `/api/tasks/[id]` | משימה ספציפית |
| GET/POST | `/api/meetings` | פגישות / יצירה |
| PUT/DELETE | `/api/meetings/[id]` | פגישה ספציפית |
| GET/POST | `/api/reminders` | תזכורות / יצירה |
| PATCH/DELETE | `/api/reminders/[id]` | עדכון / מחיקת תזכורת |
| GET/POST/DELETE | `/api/notes` | הערות |
| GET/POST | `/api/tags` | תגים |
| GET/POST | `/api/documents` | מסמכים |
| GET | `/api/dashboard` | סטטיסטיקות דשבורד |

### Query Parameters — Clients
```
GET /api/clients?search=ישראל&status=ACTIVE&priority=HIGH&page=1&limit=20
```

### Query Parameters — Tasks
```
GET /api/tasks?status=TODO&priority=URGENT&overdue=true&clientId=xxx
```

### Query Parameters — Meetings
```
GET /api/meetings?start=2024-01-01&end=2024-12-31&upcoming=true
```

---

## 🗄 Database Schema

```
Users          — משתמשים (id, email, password, role, settings)
Clients        — לקוחות (id, firstName, lastName, email, phone, status, priority...)
Tags           — תגים (id, name, color)
ClientTag      — קשר לקוח-תג (many-to-many)
Tasks          — משימות (id, title, status, priority, dueDate, clientId...)
Meetings       — פגישות (id, title, type, startTime, endTime, color, clientId...)
Notes          — הערות (id, content, clientId, userId)
Reminders      — תזכורות (id, title, type, remindAt, isRead, isDismissed...)
Documents      — מסמכים (id, name, url, size, mimeType, type, clientId...)
ActivityLog    — לוג פעילות (id, type, title, description, clientId...)
```

---

## 🚀 Deployment

### Vercel (מומלץ)

```bash
# התקן Vercel CLI
npm i -g vercel

# Deploy
vercel

# הגדר משתני סביבה ב-Vercel Dashboard:
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t crm-app .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="http://localhost:3000" \
  crm-app
```

### PostgreSQL בענן
- **Supabase** — חינמי עד 500MB
- **Neon** — Serverless PostgreSQL
- **Railway** — Deploy מהיר
- **PlanetScale** (MySQL compatible)

---

## 🔒 הרשאות

| תכונה | USER | ADMIN |
|-------|------|-------|
| צפייה בנתונים | ✅ | ✅ |
| יצירה/עריכה | ✅ (שלו בלבד) | ✅ (כולם) |
| מחיקה | ✅ (שלו בלבד) | ✅ |
| ניהול משתמשים | ❌ | ✅ |

---

## 🐛 פתרון בעיות נפוצות

**שגיאת DATABASE_URL:**
```bash
# ודא שהחיבור תקין
npx prisma db push
```

**שגיאת NEXTAUTH_SECRET:**
```bash
# יצור מפתח חדש
openssl rand -base64 32
```

**FullCalendar לא מוצג:**
```bash
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

**שגיאת Hydration ב-RTL:**
וודא שיש `dir="rtl"` ב-`<html>` ב-`app/layout.tsx`

---

## 📝 רישיון

MIT License — חופשי לשימוש אישי ומסחרי.

---

**נבנה עם ❤️ ו-Next.js 14**
