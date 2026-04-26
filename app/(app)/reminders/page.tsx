'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Check, X, Clock, Calendar, User, CheckSquare } from 'lucide-react'
import { cn, formatDateTime, formatRelative, reminderTypeLabels } from '@/lib/utils'
import { toast } from 'sonner'
import { ReminderFormDialog } from '@/components/reminders/reminder-form-dialog'
import Link from 'next/link'

const TYPE_ICONS: Record<string, any> = {
  TASK: CheckSquare,
  MEETING: Calendar,
  CLIENT: User,
  CUSTOM: Bell,
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'upcoming'>('all')

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'unread') params.set('unread', 'true')
      if (filter === 'upcoming') params.set('upcoming', 'true')
      const res = await fetch(`/api/reminders?${params}&limit=100`)
      const data = await res.json()
      setReminders(data)
    } catch {
      toast.error('שגיאה בטעינת התזכורות')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReminders() }, [filter])

  const handleAction = async (id: string, action: 'read' | 'dismiss') => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (action === 'dismiss') {
        setReminders(rs => rs.filter(r => r.id !== id))
        toast.success('תזכורת בוטלה')
      } else {
        setReminders(rs => rs.map(r => r.id === id ? { ...r, isRead: true } : r))
      }
    } catch {
      toast.error('שגיאה')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      setReminders(rs => rs.filter(r => r.id !== id))
      toast.success('תזכורת נמחקה')
    } catch {
      toast.error('שגיאה')
    }
  }

  const unreadCount = reminders.filter(r => !r.isRead).length
  const now = new Date()
  const overdueReminders = reminders.filter(r => new Date(r.remindAt) < now && !r.isDismissed)
  const upcomingReminders = reminders.filter(r => new Date(r.remindAt) >= now)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">תזכורות</h1>
          <p className="text-muted-foreground text-sm">
            {reminders.length} תזכורות
            {unreadCount > 0 && <span className="text-primary font-medium"> · {unreadCount} לא נקראו</span>}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">תזכורת חדשה</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-1">
        {[
          { key: 'all', label: 'הכל' },
          { key: 'unread', label: 'לא נקראו' },
          { key: 'upcoming', label: 'קרובות' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              filter === f.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-1">אין תזכורות</h3>
          <p className="text-muted-foreground text-sm mb-4">צור תזכורת חדשה</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            תזכורת חדשה
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue */}
          {overdueReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                עבר המועד ({overdueReminders.length})
              </h3>
              <div className="space-y-2">
                {overdueReminders.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onAction={handleAction}
                    onDelete={handleDelete}
                    overdue
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                קרובות ({upcomingReminders.length})
              </h3>
              <div className="space-y-2">
                {upcomingReminders.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onAction={handleAction}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ReminderFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(r) => { setReminders(rs => [r, ...rs]); setCreateOpen(false) }}
      />
    </div>
  )
}

function ReminderCard({ reminder, onAction, onDelete, overdue }: {
  reminder: any
  onAction: (id: string, action: 'read' | 'dismiss') => void
  onDelete: (id: string) => void
  overdue?: boolean
}) {
  const Icon = TYPE_ICONS[reminder.type] || Bell

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 bg-card border rounded-xl transition-all group',
      !reminder.isRead && 'border-primary/30 bg-primary/5',
      overdue && 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10'
    )}>
      <div className={cn(
        'p-2 rounded-lg shrink-0',
        overdue ? 'bg-red-100 dark:bg-red-950/50 text-red-600' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn('text-sm font-medium', overdue && 'text-red-700 dark:text-red-400')}>
              {reminder.title}
            </p>
            {reminder.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{reminder.description}</p>
            )}
          </div>
          {!reminder.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(reminder.remindAt)}
          </span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded bg-muted',
            overdue && 'bg-red-100 dark:bg-red-950/50 text-red-600'
          )}>
            {reminderTypeLabels[reminder.type]}
          </span>
          {reminder.client && (
            <Link href={`/clients/${reminder.client.id}`} className="text-xs text-primary hover:underline">
              {reminder.client.firstName} {reminder.client.lastName}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!reminder.isRead && (
          <button
            onClick={() => onAction(reminder.id, 'read')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            title="סמן כנקרא"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onAction(reminder.id, 'dismiss')}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          title="בטל תזכורת"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="מחק"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
