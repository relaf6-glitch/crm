'use client'

import Link from 'next/link'
import { HDate } from '@hebcal/core'
import {
  Users, CheckSquare, AlertTriangle, Clock, Calendar,
  TrendingUp, Activity, ChevronLeft, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { cn, formatDateTime, formatRelative, formatDate } from '@/lib/utils'

interface DashboardClientProps {
  userName: string
  data: {
    totalClients: number
    activeClients: number
    openTasks: number
    urgentTasks: number
    overdueTasks: number
    upcomingMeetings: any[]
    inactiveClients: any[]
    recentActivity: any[]
    tasksByStatus: { status: string; count: number }[]
    monthlyData: { month: string; clients: number; tasks: number }[]
  }
}

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
  CANCELLED: '#6b7280',
}

const TASK_STATUS_HE: Record<string, string> = {
  TODO: 'לביצוע',
  IN_PROGRESS: 'בתהליך',
  DONE: 'הושלם',
  CANCELLED: 'בוטל',
}

const HEBREW_MONTHS = ['ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשון','כסלו','טבת','שבט','אדר','אדר ב']
const HEBREW_NUMBERS = ['','א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ׳','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל׳']

function getHebrewDate(): string {
  try {
    const hd = new HDate(new Date())
    const day = HEBREW_NUMBERS[hd.getDate()] || hd.getDate().toString()
    const month = HEBREW_MONTHS[hd.getMonth() - 1] || ''
 return hd.renderGematriya(true)
  } catch {
    return ''
  }
}

export function DashboardClient({ data, userName }: DashboardClientProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'

  const todayLatin = new Date().toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const todayHebrew = getHebrewDate()

  const statCards = [
    {
      title: 'סה"כ לקוחות',
      value: data.totalClients,
      sub: `${data.activeClients} פעילים`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      href: '/clients',
    },
    {
      title: 'משימות פתוחות',
      value: data.openTasks,
      sub: data.urgentTasks > 0 ? `${data.urgentTasks} דחופות` : 'הכל בסדר',
      icon: CheckSquare,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      href: '/tasks',
    },
    {
      title: 'משימות שפגו',
      value: data.overdueTasks,
      sub: data.overdueTasks > 0 ? 'דורשות טיפול' : 'הכל בסדר ✓',
      icon: AlertTriangle,
      color: data.overdueTasks > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: data.overdueTasks > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
      href: '/tasks?overdue=true',
    },
    {
      title: 'פגישות קרובות',
      value: data.upcomingMeetings.length,
      sub: 'ב-7 ימים הקרובים',
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      href: '/calendar',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {userName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{todayLatin}</p>
          {todayHebrew && <p className="text-muted-foreground text-sm">{todayHebrew}</p>}
        </div>
        <Link
          href="/clients/new"
          className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span>+ לקוח חדש</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2.5 rounded-xl', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div className="text-3xl font-bold tracking-tight">{card.value}</div>
            <div className="text-sm font-medium text-foreground mt-0.5">{card.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              התקדמות חודשית
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'Heebo' }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  fontFamily: 'Heebo, sans-serif',
                  borderRadius: 10,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
                formatter={(v, name) => [v, name === 'clients' ? 'לקוחות' : 'משימות שהושלמו']}
              />
              <Area type="monotone" dataKey="clients" stroke="#3b82f6" fill="url(#colorClients)" strokeWidth={2} />
              <Area type="monotone" dataKey="tasks" stroke="#10b981" fill="url(#colorTasks)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-primary" />
            משימות לפי סטטוס
          </h3>
          {data.tasksByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={data.tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.tasksByStatus.map((entry) => (
                      <Cell key={entry.status} fill={TASK_STATUS_COLORS[entry.status] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [v, TASK_STATUS_HE[name as string] || name]}
                    contentStyle={{ fontFamily: 'Heebo, sans-serif', borderRadius: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.tasksByStatus.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: TASK_STATUS_COLORS[entry.status] }} />
                      <span className="text-muted-foreground">{TASK_STATUS_HE[entry.status]}</span>
                    </div>
                    <span className="font-semibold">{entry.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              אין משימות עדיין
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              פגישות קרובות
            </h3>
            <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              כל הפגישות <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {data.upcomingMeetings.length === 0 ? (
            <EmptyState icon="📅" text="אין פגישות קרובות" />
          ) : (
            <div className="space-y-2">
              {data.upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ background: meeting.color || '#6366f1' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(meeting.startTime)}</p>
                    {meeting.client && (
                      <p className="text-xs text-primary mt-0.5">{meeting.client.firstName} {meeting.client.lastName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              לא בקשר זמן רב
            </h3>
            <Link href="/clients" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              כל הלקוחות <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {data.inactiveClients.length === 0 ? (
            <EmptyState icon="🎉" text="כל הלקוחות עם קשר עדכני!" />
          ) : (
            <div className="space-y-2">
              {data.inactiveClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{client.firstName} {client.lastName}</p>
                    <p className="text-xs text-muted-foreground">{client.lastContact ? formatRelative(client.lastContact) : 'אף פעם'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            פעילות אחרונה
          </h3>
          {data.recentActivity.length === 0 ? (
            <EmptyState icon="📋" text="אין פעילות אחרונה" />
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map(log => (
                <div key={log.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{log.title}</p>
                    {log.description && <p className="text-xs text-muted-foreground truncate">{log.description}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{formatRelative(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
