'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'

const schema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  type: z.enum(['TASK', 'MEETING', 'CLIENT', 'CUSTOM']),
  remindAt: z.string().min(1, 'תאריך ושעה חובה'),
  clientId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ReminderFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (reminder: any) => void
  initialData?: any
}

export function ReminderFormDialog({ open, onClose, onSuccess, initialData }: ReminderFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const isEdit = !!initialData

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CUSTOM' },
  })

  useEffect(() => {
    if (open) {
      fetch('/api/clients?limit=100').then((r) => r.json()).then((d) => setClients(d.clients || []))
      if (initialData) {
        reset({
          title: initialData.title,
          description: initialData.description || '',
          type: initialData.type,
          remindAt: format(new Date(initialData.remindAt), "yyyy-MM-dd'T'HH:mm"),
          clientId: initialData.clientId || '',
        })
      } else {
        reset({
          type: 'CUSTOM',
          remindAt: format(addDays(new Date(), 1), "yyyy-MM-dd'T'09:00"),
          title: '',
          description: '',
          clientId: '',
        })
      }
    }
  }, [open, initialData, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/reminders/${initialData.id}` : '/api/reminders'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clientId: data.clientId || null,
          remindAt: new Date(data.remindAt).toISOString(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const reminder = await res.json()
      toast.success(isEdit ? 'תזכורת עודכנה' : 'תזכורת נוצרה')
      onSuccess(reminder)
    } catch (e: any) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">{isEdit ? 'עריכת תזכורת' : 'תזכורת חדשה'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">כותרת *</label>
            <input
              {...register('title')}
              placeholder="תזכורת..."
              className={cn('w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', !!errors.title && 'border-destructive')}
            />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">תיאור</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="פרטים נוספים..."
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">סוג</label>
              <select {...register('type')} className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="CUSTOM">מותאם אישית</option>
                <option value="TASK">משימה</option>
                <option value="MEETING">פגישה</option>
                <option value="CLIENT">לקוח</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">לקוח</label>
              <select {...register('clientId')} className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="">ללא לקוח</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">תאריך ושעה *</label>
            <input
              {...register('remindAt')}
              type="datetime-local"
              className={cn('w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all', !!errors.remindAt && 'border-destructive')}
            />
            {errors.remindAt && <p className="text-destructive text-xs mt-1">{errors.remindAt.message}</p>}
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
              {isEdit ? 'שמור שינויים' : 'צור תזכורת'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
