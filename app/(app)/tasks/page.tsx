'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, List, Columns, CheckSquare, AlertTriangle, Clock, Search } from 'lucide-react'
import { cn, taskStatusLabels, taskPriorityLabels, getTaskStatusClass, getTaskPriorityClass, formatDate, isOverdue } from '@/lib/utils'
import { toast } from 'sonner'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { useAppStore } from '@/store/app-store'

const KANBAN_COLS = [
  { status: 'TODO', label: 'לביצוע', color: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { status: 'IN_PROGRESS', label: 'בתהליך', color: 'border-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  { status: 'DONE', label: 'הושלם', color: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { status: 'CANCELLED', label: 'בוטל', color: 'border-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/20' },
]

export default function TasksPage() {
  const searchParams = useSearchParams()
  const { taskView, setTaskView } = useAppStore()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
        ...(searchParams.get('overdue') === 'true' && { overdue: 'true' }),
        limit: '200',
      })
      const res = await fetch(`/api/tasks?${params}`)
      const data = await res.json()
      setTasks(data)
    } catch {
      toast.error('שגיאה בטעינת המשימות')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority, searchParams])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const updated = await res.json()
      setTasks(ts => ts.map(t => t.id === taskId ? updated : t))
      if (status === 'DONE') toast.success('משימה הושלמה! 🎉')
    } catch {
      toast.error('שגיאה בעדכון משימה')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('למחוק משימה זו?')) return
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      setTasks(ts => ts.filter(t => t.id !== taskId))
      toast.success('המשימה נמחקה')
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const overdueCount = tasks.filter(t => isOverdue(t.dueDate) && !['DONE', 'CANCELLED'].includes(t.status)).length
  const urgentCount = tasks.filter(t => t.priority === 'URGENT' && !['DONE', 'CANCELLED'].includes(t.status)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">משימות</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-muted-foreground text-sm">{tasks.length} משימות</span>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} שפגו
              </span>
            )}
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                <Clock className="w-3 h-3" />
                {urgentCount} דחופות
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">משימה חדשה</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש משימות..."
            className="w-full bg-background border rounded-xl py-2 pe-9 ps-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">כל הסטטוסים</option>
          <option value="TODO">לביצוע</option>
          <option value="IN_PROGRESS">בתהליך</option>
          <option value="DONE">הושלם</option>
          <option value="CANCELLED">בוטל</option>
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="bg-background border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">כל העדיפויות</option>
          <option value="URGENT">דחוף</option>
          <option value="HIGH">גבוה</option>
          <option value="MEDIUM">בינוני</option>
          <option value="LOW">נמוך</option>
        </select>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 border rounded-xl p-1">
          <button
            onClick={() => setTaskView('kanban')}
            className={cn('p-1.5 rounded-lg transition-colors', taskView === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
            title="תצוגת Kanban"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTaskView('list')}
            className={cn('p-1.5 rounded-lg transition-colors', taskView === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
            title="תצוגת רשימה"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : taskView === 'kanban' ? (
        <KanbanView
          tasks={filtered}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={setEditTask}
        />
      ) : (
        <ListView
          tasks={filtered}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={setEditTask}
        />
      )}

      <TaskFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(task) => { setTasks(ts => [task, ...ts]); setCreateOpen(false) }}
      />
      {editTask && (
        <TaskFormDialog
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSuccess={(updated) => { setTasks(ts => ts.map(t => t.id === updated.id ? updated : t)); setEditTask(null) }}
          initialData={editTask}
        />
      )}
    </div>
  )
}

function KanbanView({ tasks, onStatusChange, onDelete, onEdit }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter((t: any) => t.status === col.status)
        return (
          <div key={col.status} className={cn('rounded-xl border-t-2 bg-muted/30 min-h-[300px]', col.color)}>
            <div className={cn('px-3 py-2.5 rounded-t-xl', col.bg)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2">
              {colTasks.map((task: any) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  compact
                />
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                  אין משימות
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ tasks, onStatusChange, onDelete, onEdit }: any) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckSquare className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground">אין משימות</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task: any) => (
        <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  )
}

function TaskCard({ task, onStatusChange, onDelete, onEdit, compact }: any) {
  const overdue = isOverdue(task.dueDate) && !['DONE', 'CANCELLED'].includes(task.status)

  return (
    <div className={cn(
      'bg-card border rounded-xl p-3 group hover:shadow-sm transition-all',
      overdue && 'border-red-200 dark:border-red-900/50',
      task.status === 'DONE' && 'opacity-60'
    )}>
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={task.status === 'DONE'}
          onChange={() => {
            if (task.status !== 'DONE') onStatusChange(task.id, 'DONE')
            else onStatusChange(task.id, 'TODO')
          }}
          className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', task.status === 'DONE' && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {!compact && task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', getTaskPriorityClass(task.priority))}>
              {taskPriorityLabels[task.priority]}
            </span>
            {task.client && (
              <Link href={`/clients/${task.client.id}`} className="text-xs text-primary hover:underline">
                {task.client.firstName} {task.client.lastName}
              </Link>
            )}
            {task.dueDate && (
              <span className={cn('text-xs', overdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
              </span>
            )}
            {task.category && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {task.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-accent text-muted-foreground text-xs">✏️</button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs">🗑</button>
        </div>
      </div>
    </div>
  )
}
