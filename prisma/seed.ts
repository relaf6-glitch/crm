import { PrismaClient, UserRole, ClientStatus, ClientPriority, TaskStatus, TaskPriority, MeetingType, ReminderType, DocumentType, ActivityType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 מתחיל seed...')

  // ─── Users ───────────────────────────────────────────────────────────────

  const adminPassword = await hash('admin123', 12)
  const userPassword = await hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'אריאל כהן',
      password: adminPassword,
      role: UserRole.ADMIN,
      settings: { theme: 'light', language: 'he', notifications: true },
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      name: 'מיכל לוי',
      password: userPassword,
      role: UserRole.USER,
      settings: { theme: 'dark', language: 'he', notifications: true },
    },
  })

  console.log('✅ משתמשים נוצרו')

  // ─── Tags ─────────────────────────────────────────────────────────────────

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name_userId: { name: 'VIP', userId: admin.id } }, update: {}, create: { name: 'VIP', color: '#f59e0b', userId: admin.id } }),
    prisma.tag.upsert({ where: { name_userId: { name: 'עורך דין', userId: admin.id } }, update: {}, create: { name: 'עורך דין', color: '#3b82f6', userId: admin.id } }),
    prisma.tag.upsert({ where: { name_userId: { name: 'חברה', userId: admin.id } }, update: {}, create: { name: 'חברה', color: '#10b981', userId: admin.id } }),
    prisma.tag.upsert({ where: { name_userId: { name: 'מגזר ציבורי', userId: admin.id } }, update: {}, create: { name: 'מגזר ציבורי', color: '#8b5cf6', userId: admin.id } }),
    prisma.tag.upsert({ where: { name_userId: { name: 'עסק קטן', userId: admin.id } }, update: {}, create: { name: 'עסק קטן', color: '#ef4444', userId: admin.id } }),
  ])

  console.log('✅ תגים נוצרו')

  // ─── Clients ──────────────────────────────────────────────────────────────

  const clientsData = [
    { firstName: 'דוד', lastName: 'לוי', email: 'david.levi@example.com', phone: '050-1234567', company: 'חברת לוי בע"מ', status: ClientStatus.ACTIVE, priority: ClientPriority.HIGH, lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { firstName: 'שרה', lastName: 'כהן', email: 'sarah.cohen@example.com', phone: '052-2345678', company: 'עו"ד שרה כהן', status: ClientStatus.ACTIVE, priority: ClientPriority.HIGH, lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { firstName: 'יוסי', lastName: 'אברהם', email: 'yossi@example.com', phone: '054-3456789', company: '', status: ClientStatus.LEAD, priority: ClientPriority.MEDIUM, lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { firstName: 'רחל', lastName: 'פרץ', email: 'rachel.peretz@example.com', phone: '058-4567890', company: 'עיריית תל אביב', status: ClientStatus.ACTIVE, priority: ClientPriority.MEDIUM, lastContact: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    { firstName: 'משה', lastName: 'גרין', email: 'moshe.green@example.com', phone: '053-5678901', company: 'גרין טק', status: ClientStatus.PROSPECT, priority: ClientPriority.LOW, lastContact: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { firstName: 'אסתר', lastName: 'מזרחי', email: 'esther.m@example.com', phone: '050-6789012', company: 'מזרחי ייעוץ', status: ClientStatus.ACTIVE, priority: ClientPriority.HIGH, lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { firstName: 'אלי', lastName: 'שפירא', email: 'eli.shapira@example.com', phone: '052-7890123', company: 'שפירא ושות\'', status: ClientStatus.INACTIVE, priority: ClientPriority.LOW, lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    { firstName: 'נועה', lastName: 'ביטון', email: 'noa.biton@example.com', phone: '054-8901234', company: '', status: ClientStatus.LEAD, priority: ClientPriority.MEDIUM, lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { firstName: 'ארז', lastName: 'חדד', email: 'erez.hadad@example.com', phone: '058-9012345', company: 'חדד נדל"ן', status: ClientStatus.ACTIVE, priority: ClientPriority.HIGH, lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { firstName: 'לימור', lastName: 'אלון', email: 'limor.alon@example.com', phone: '053-0123456', company: 'אלון יועצים', status: ClientStatus.CHURNED, priority: ClientPriority.LOW, lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
  ]

  const clients = []
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        ...clientData,
        userId: admin.id,
        notes: `לקוח ${clientData.firstName} - הערות כלליות`,
        address: 'תל אביב, ישראל',
      },
    })
    clients.push(client)
  }

  // Assign tags to clients
  await prisma.clientTag.createMany({
    data: [
      { clientId: clients[0].id, tagId: tags[0].id }, // VIP
      { clientId: clients[0].id, tagId: tags[2].id }, // חברה
      { clientId: clients[1].id, tagId: tags[1].id }, // עורך דין
      { clientId: clients[1].id, tagId: tags[0].id }, // VIP
      { clientId: clients[3].id, tagId: tags[3].id }, // מגזר ציבורי
      { clientId: clients[4].id, tagId: tags[4].id }, // עסק קטן
      { clientId: clients[5].id, tagId: tags[0].id }, // VIP
      { clientId: clients[8].id, tagId: tags[2].id }, // חברה
    ],
    skipDuplicates: true,
  })

  console.log('✅ לקוחות נוצרו')

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const now = new Date()
  const tasksData = [
    { title: 'הכנת חוות דעת משפטית', description: 'לסקור את החוזה ולהכין חוות דעת מפורטת', clientId: clients[0].id, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), category: 'משפטי' },
    { title: 'שיחת מעקב עם לקוח', description: 'לבצע שיחת מעקב על מצב התיק', clientId: clients[1].id, status: TaskStatus.TODO, priority: TaskPriority.URGENT, dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), category: 'תקשורת' },
    { title: 'הגשת מסמכים לבית משפט', description: 'הגשת כתב טענות ראשוני', clientId: clients[1].id, status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), category: 'משפטי' },
    { title: 'עדכון פרטי לקוח', description: 'עדכון כתובת וטלפון', clientId: clients[2].id, status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), category: 'ניהולי' },
    { title: 'שליחת הצעת מחיר', description: 'הכנה ושליחה של הצעת מחיר ללקוח חדש', clientId: clients[3].id, status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), completedAt: new Date(), category: 'מכירות' },
    { title: 'הכנת כתב תביעה', description: 'ניסוח כתב תביעה בסכום של 500,000 ש"ח', clientId: clients[5].id, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), category: 'משפטי' },
    { title: 'ייעוץ בחוזה שכירות', description: 'בדיקת חוזה שכירות מסחרי', clientId: clients[4].id, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), category: 'נדל"ן' },
    { title: 'הכנת דו"ח חודשי', description: 'ריכוז נתונים וסטטיסטיקות לדו"ח החודשי', clientId: null, status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), category: 'ניהולי' },
    { title: 'משימה שפגה - להשלים', description: 'משימה שהיה צריך להשלים', clientId: clients[6].id, status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), category: 'משפטי' },
    { title: 'פגישת היכרות', description: 'פגישת היכרות ראשונה עם לקוח פוטנציאלי', clientId: clients[7].id, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), category: 'מכירות' },
  ]

  const tasks = await Promise.all(
    tasksData.map(task =>
      prisma.task.create({
        data: { ...task, userId: admin.id },
      })
    )
  )

  console.log('✅ משימות נוצרו')

  // ─── Meetings ─────────────────────────────────────────────────────────────

  const meetingsData = [
    { title: 'ישיבת תיאום עם דוד לוי', clientId: clients[0].id, type: MeetingType.IN_PERSON, startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), location: 'משרד תל אביב', color: '#3b82f6' },
    { title: 'שיחת ועידה - שרה כהן', clientId: clients[1].id, type: MeetingType.VIDEO, startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), location: 'Zoom', color: '#10b981' },
    { title: 'פגישת ייעוץ - רחל פרץ', clientId: clients[3].id, type: MeetingType.IN_PERSON, startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 30 * 60 * 1000), location: 'משרד הלקוח', color: '#f59e0b' },
    { title: 'שיחת מעקב - אסתר מזרחי', clientId: clients[5].id, type: MeetingType.CALL, startTime: new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 0.5 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000 + 30 * 60 * 1000), color: '#ef4444' },
    { title: 'פגישה עם ארז חדד', clientId: clients[8].id, type: MeetingType.IN_PERSON, startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), location: 'בית קפה', color: '#8b5cf6' },
    { title: 'פגישה שהתקיימה - לוי', clientId: clients[0].id, type: MeetingType.IN_PERSON, startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), notes: 'הפגישה עברה בהצלחה. הוסכם על המשך הטיפול.', color: '#3b82f6' },
  ]

  const meetings = await Promise.all(
    meetingsData.map(meeting =>
      prisma.meeting.create({
        data: { ...meeting, userId: admin.id },
      })
    )
  )

  console.log('✅ פגישות נוצרו')

  // ─── Notes ────────────────────────────────────────────────────────────────

  await prisma.note.createMany({
    data: [
      { userId: admin.id, clientId: clients[0].id, content: 'לקוח VIP - חשוב לתת עדיפות מיידית לכל פנייה. יש לו חברה בתחום הנדל"ן והוא מצפה לשירות אישי.' },
      { userId: admin.id, clientId: clients[0].id, content: 'בשיחה האחרונה ציין שהוא מתכנן להרחיב את העסק ויצטרך ייעוץ משפטי נוסף.' },
      { userId: admin.id, clientId: clients[1].id, content: 'עורכת דין במשרד גדול. יש לה ניסיון של 15 שנה. מעוניינת בשיתוף פעולה מקצועי.' },
      { userId: admin.id, clientId: clients[2].id, content: 'לקוח חדש שפנה דרך הפניה מדוד לוי. צריך לברר מה הצרכים המדויקים שלו.' },
      { userId: admin.id, clientId: clients[5].id, content: 'אסתר היא לקוחה ותיקה ומרוצה. מפנה לקוחות חדשים בקביעות.' },
    ],
  })

  console.log('✅ הערות נוצרו')

  // ─── Reminders ────────────────────────────────────────────────────────────

  await prisma.reminder.createMany({
    data: [
      { userId: admin.id, clientId: clients[0].id, taskId: tasks[0].id, title: 'חוות דעת - דוד לוי', description: 'לסיים את חוות הדעת המשפטית', type: ReminderType.TASK, remindAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) },
      { userId: admin.id, meetingId: meetings[0].id, title: 'תזכורת לפגישה עם דוד לוי', description: 'פגישה בשעה 10:00', type: ReminderType.MEETING, remindAt: new Date(now.getTime() + 23 * 60 * 60 * 1000) },
      { userId: admin.id, clientId: clients[4].id, title: 'ליצור קשר עם משה גרין', description: 'לא היה קשר כבר חודש', type: ReminderType.CLIENT, remindAt: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      { userId: admin.id, title: 'הכנת דו"ח שבועי', description: 'לסכם את פעילות השבוע', type: ReminderType.CUSTOM, remindAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) },
      { userId: admin.id, clientId: clients[6].id, title: 'מעקב אחרי אלי שפירא', description: 'לקוח לא פעיל - לנסות להחזיר', type: ReminderType.CLIENT, remindAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    ],
  })

  console.log('✅ תזכורות נוצרו')

  // ─── Activity Logs ────────────────────────────────────────────────────────

  const activitiesToCreate = [
    { userId: admin.id, clientId: clients[0].id, type: ActivityType.CLIENT_CREATED, title: 'לקוח חדש נוצר', description: 'דוד לוי התווסף למערכת' },
    { userId: admin.id, clientId: clients[1].id, type: ActivityType.CLIENT_CREATED, title: 'לקוח חדש נוצר', description: 'שרה כהן התווספה למערכת' },
    { userId: admin.id, clientId: clients[0].id, type: ActivityType.TASK_CREATED, title: 'משימה חדשה', description: 'הכנת חוות דעת משפטית נוצרה' },
    { userId: admin.id, clientId: clients[1].id, type: ActivityType.MEETING_CREATED, title: 'פגישה נוצרה', description: 'שיחת ועידה עם שרה כהן תוזמנה' },
    { userId: admin.id, clientId: clients[3].id, type: ActivityType.TASK_COMPLETED, title: 'משימה הושלמה', description: 'שליחת הצעת מחיר לרחל פרץ' },
    { userId: admin.id, clientId: clients[5].id, type: ActivityType.NOTE_CREATED, title: 'הערה נוספה', description: 'הערה נוספה לתיק אסתר מזרחי' },
    { userId: admin.id, clientId: clients[2].id, type: ActivityType.CLIENT_UPDATED, title: 'לקוח עודכן', description: 'פרטי יוסי אברהם עודכנו' },
  ]

  // Add different timestamps
  for (let i = 0; i < activitiesToCreate.length; i++) {
    await prisma.activityLog.create({
      data: {
        ...activitiesToCreate[i],
        createdAt: new Date(now.getTime() - i * 6 * 60 * 60 * 1000),
      },
    })
  }

  console.log('✅ לוג פעילות נוצר')
  console.log('')
  console.log('🎉 Seed הושלם בהצלחה!')
  console.log('')
  console.log('משתמשי demo:')
  console.log('  אדמין: admin@demo.com / admin123')
  console.log('  משתמש: user@demo.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
