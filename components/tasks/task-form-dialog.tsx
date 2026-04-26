'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const schema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.string().optional(),
  dueDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TaskFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (task: any) => void
  initialData?: any
  defaultClientId?: string
}

export function TaskFormDialog({ open, onClose, onSuccess, initialData, defaultClientId }: TaskFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const isEdit = !!initialData

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'TODO', priority: 'MEDIUM' },
  })

  useEffect(() => {
    if (open) {
      fetch('/api/clients?limit=100').then(r => r.json()).then(d => setClients(d.clients || []))
      if (initialData) {
        reset({
          title: initialData.title,
          description: initialData.description || '',
          clientId: initialData.clientId || '',
          status: initialData.status,
          priority: initialData.priority,
          category: initialData.category || '',
          dueDate: initialData.dueDate
            ? format(new Date(initialData.dueDate), "yyyy-MM-dd'T'HH:mm")
            : '',
        })
      } else {
        reset({ status: 'TODO', priority: 'MEDIUM', clientId: defaultClientId || '', title: '', description: '', category: '', dueDate: '' })
      }
    }
  }, [open, initialData, defaultClientId, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/tasks/${initialData.id}` : '/api/tasks'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clientId: data.clientId || null,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const task = await res.json()
      toast.success(isEdit ? 'משימה עודכנה' : 'משימה נוצרה')
      onSuccess(task)
    } catch (e: any) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const inp = (hasError?: boolean) => cn(
    'w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70',
    hasError && 'border-destructive'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <h2 className="text-lg font-bold">{isEdit ? 'עריכת משימה' : 'משימה חדשה'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">כותרת *</label>
            <input {...register('title')} placeholder="כותרת המשימה" className={inp(!!errors.title)} />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">תיאור</label>
            <textarea {...register('description')} rows={2} placeholder="תיאור מפורט..." className={cn(inp(), 'resize-none')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">עדיפות</label>
              <select {...register('priority')} className={inp()}>
                <option value="URGENT">דחוף 🔴</option>
                <option value="HIGH">גבוה 🟠</option>
                <option value="MEDIUM">בינוני 🟡</option>
                <option value="LOW">נמוך 🟢</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">סטטוס</label>
              <select {...register('status')} className={inp()}>
                <option value="TODO">לביצוע</option>
                <option value="IN_PROGRESS">בתהליך</option>
                <option value="DONE">הושלם</option>
                <option value="CANCELLED">בוטל</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">לקוח</label>
            <select {...register('clientId')} className={inp()}>
              <option value="">ללא לקוח</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">תאריך יעד</label>
              <input {...register('dueDate')} type="datetime-local" className={inp()} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">קטגוריה</label>
              <input {...register('category')} placeholder="משפטי, ניהולי..." className={inp()} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent">
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'שמור' : 'צור משימה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
