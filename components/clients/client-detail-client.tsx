'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Phone, Mail, MapPin, Building2, Edit, Trash2,
  CheckSquare, Calendar, FileText, Bell, Activity, Plus,
  MessageSquare, Clock, Tag
} from 'lucide-react'
import { cn, clientStatusLabels, clientPriorityLabels, getClientStatusClass, getTaskStatusClass, taskStatusLabels, taskPriorityLabels, getTaskPriorityClass, formatDate, formatDateTime, formatRelative, activityTypeLabels, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { ClientFormDialog } from './client-form-dialog'

const TABS = [
  { key: 'overview', label: 'סקירה', icon: Activity },
  { key: 'tasks', label: 'משימות', icon: CheckSquare },
  { key: 'meetings', label: 'פגישות', icon: Calendar },
  { key: 'notes', label: 'הערות', icon: MessageSquare },
  { key: 'documents', label: 'מסמכים', icon: FileText },
  { key: 'reminders', label: 'תזכורות', icon: Bell },
]

export function ClientDetailClient({ client: initialClient }: { client: any }) {
  const router = useRouter()
  const [client, setClient] = useState(initialClient)
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`למחוק את ${client.firstName} ${client.lastName}? פעולה זו אינה הפיכה.`)) return
    try {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      toast.success('הלקוח נמחק')
      router.push('/clients')
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, clientId: client.id }),
      })
      const note = await res.json()
      setClient((c: any) => ({ ...c, clientNotes: [note, ...c.clientNotes] }))
      setNewNote('')
      toast.success('ההערה נוספה')
    } catch {
      toast.error('שגיאה בהוספת הערה')
    } finally {
      setSavingNote(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      })
      setClient((c: any) => ({
        ...c,
        tasks: c.tasks.map((t: any) => t.id === taskId ? { ...t, status: 'DONE' } : t),
      }))
      toast.success('משימה הושלמה!')
    } catch {
      toast.error('שגיאה בעדכון משימה')
    }
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clients" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />
          לקוחות
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{client.firstName} {client.lastName}</span>
      </div>

      {/* Profile card */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
              {getInitials(`${client.firstName} ${client.lastName}`)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{client.firstName} {client.lastName}</h1>
              {client.company && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {client.company}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', getClientStatusClass(client.status))}>
                  {clientStatusLabels[client.status]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  עדיפות {clientPriorityLabels[client.priority]}
                </span>
                {client.tags?.map((ct: any) => (
                  <span
                    key={ct.tag.id}
                    className="px-2 py-0.5 rounded-full text-xs text-white flex items-center gap-1"
                    style={{ background: ct.tag.color }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {ct.tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">עריכה</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span dir="ltr">{client.phone}</span>
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{client.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>קשר: {client.lastContact ? formatRelative(client.lastContact) : 'אף פעם'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'משימות', value: client._count?.tasks || 0 },
            { label: 'פגישות', value: client._count?.meetings || 0 },
            { label: 'מסמכים', value: client._count?.documents || 0 },
          ].map(stat => (
            <div key={stat.label} className="text-center p-3 bg-muted/40 rounded-xl">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex overflow-x-auto gap-0 scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Notes */}
            {client.notes && (
              <div className="bg-card border rounded-xl p-4">
                <h3 className="font-semibold mb-2 text-sm">הערות כלליות</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
            {/* Recent activity */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-sm">פעילות אחרונה</h3>
              <div className="space-y-3">
                {client.activityLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs">{log.title}</p>
                      {log.description && <p className="text-xs text-muted-foreground">{log.description}</p>}
                      <p className="text-xs text-muted-foreground/60">{formatRelative(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {client.activityLogs.length === 0 && <p className="text-sm text-muted-foreground">אין פעילות עדיין</p>}
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">משימות ({client.tasks.length})</h3>
              <Link
                href={`/tasks/new?clientId=${client.id}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                משימה חדשה
              </Link>
            </div>
            {client.tasks.length === 0 ? (
              <EmptyState icon="✅" text="אין משימות עדיין" />
            ) : (
              <div className="space-y-2">
                {client.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-card border rounded-xl hover:bg-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={task.status === 'DONE'}
                      onChange={() => task.status !== 'DONE' && handleCompleteTask(task.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', task.status === 'DONE' && 'line-through text-muted-foreground')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getTaskStatusClass(task.status))}>
                          {taskStatusLabels[task.status]}
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getTaskPriorityClass(task.priority))}>
                          {taskPriorityLabels[task.priority]}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'meetings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">פגישות ({client.meetings.length})</h3>
              <Link
                href={`/calendar/new?clientId=${client.id}`}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                פגישה חדשה
              </Link>
            </div>
            {client.meetings.length === 0 ? (
              <EmptyState icon="📅" text="אין פגישות עדיין" />
            ) : (
              <div className="space-y-2">
                {client.meetings.map((meeting: any) => (
                  <div key={meeting.id} className="flex items-start gap-3 p-3 bg-card border rounded-xl">
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: meeting.color || '#6366f1' }} />
                    <div>
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(meeting.startTime)}</p>
                      {meeting.location && <p className="text-xs text-muted-foreground">{meeting.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            {/* Add note */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-sm">הוסף הערה</h3>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={3}
                placeholder="כתוב הערה על הלקוח..."
                className="w-full bg-muted/40 border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || savingNote}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                שמור הערה
              </button>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              {client.clientNotes.map((note: any) => (
                <div key={note.id} className="bg-card border rounded-xl p-4">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatRelative(note.createdAt)}</p>
                </div>
              ))}
              {client.clientNotes.length === 0 && <EmptyState icon="📝" text="אין הערות עדיין" />}
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div>
            {client.documents.length === 0 ? (
              <EmptyState icon="📁" text="אין מסמכים עדיין" />
            ) : (
              <div className="space-y-2">
                {client.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-card border rounded-xl">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                    </div>
                    <a href={doc.url} target="_blank" className="text-xs text-primary hover:underline">פתח</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reminders' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">תזכורות</h3>
            </div>
            {client.reminders.length === 0 ? (
              <EmptyState icon="🔔" text="אין תזכורות עדיין" />
            ) : (
              <div className="space-y-2">
                {client.reminders.map((reminder: any) => (
                  <div key={reminder.id} className={cn(
                    'flex items-start gap-3 p-3 bg-card border rounded-xl',
                    !reminder.isRead && 'border-primary/30 bg-primary/5'
                  )}>
                    <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{reminder.title}</p>
                      {reminder.description && <p className="text-xs text-muted-foreground">{reminder.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(reminder.remindAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ClientFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => { setClient({ ...client, ...updated }); setEditOpen(false) }}
        initialData={client}
      />
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
