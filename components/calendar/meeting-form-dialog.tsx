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
  type: z.enum(['CALL', 'VIDEO', 'IN_PERSON', 'OTHER']),
  startTime: z.string().min(1, 'תאריך ושעה חובה'),
  endTime: z.string().optional(),
  location: z.string().optional(),
  color: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface MeetingFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (meeting: any) => void
  initialData?: any
  defaultDate?: string | null
  defaultClientId?: string
}

export function MeetingFormDialog({
  open, onClose, onSuccess, initialData, defaultDate, defaultClientId
}: MeetingFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedColor, setSelectedColor] = useState('#6366f1')
  const isEdit = !!initialData

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CALL', color: '#6366f1' },
  })

  useEffect(() => {
    if (open) {
      fetch('/api/clients?limit=100').then(r => r.json()).then(d => setClients(d.clients || []))

      if (initialData) {
        const color = initialData.color || '#6366f1'
        setSelectedColor(color)
        reset({
          title: initialData.title,
          description: initialData.description || '',
          clientId: initialData.clientId || '',
          type: initialData.type,
          startTime: format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm"),
          endTime: initialData.endTime ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm") : '',
          location: initialData.location || '',
          color,
        })
      } else {
        const defaultStart = defaultDate
          ? `${defaultDate}T09:00`
          : format(new Date(), "yyyy-MM-dd'T'HH:mm")
        setSelectedColor('#6366f1')
        reset({
          type: 'CALL', color: '#6366f1', title: '', description: '',
          clientId: defaultClientId || '',
          startTime: defaultStart, endTime: '', location: '',
        })
      }
    }
  }, [open, initialData, defaultDate, defaultClientId, reset])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setValue('color', color)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/meetings/${initialData.id}` : '/api/meetings'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clientId: data.clientId || null,
          startTime: new Date(data.startTime).toISOString(),
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
          color: selectedColor,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message)
      const meeting = await res.json()
      toast.success(isEdit ? 'הפגישה עודכנה' : 'הפגישה נוצרה')
      onSuccess(meeting)
    } catch (e: any) {
      toast.error(e.message || 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const inp = (err?: boolean) => cn(
    'w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70',
    err && 'border-destructive'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <h2 className="text-lg font-bold">{isEdit ? 'עריכת פגישה' : 'פגישה חדשה'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">כותרת *</label>
            <input {...register('title')} placeholder="שם הפגישה" className={inp(!!errors.title)} />
            {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">לקוח</label>
            <select {...register('clientId')} className={inp()}>
              <option value="">ללא לקוח</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">סוג פגישה</label>
            <select {...register('type')} className={inp()}>
              <option value="CALL">📞 שיחת טלפון</option>
              <option value="VIDEO">💻 וידאו קול</option>
              <option value="IN_PERSON">🤝 פגישה פיזית</option>
              <option value="OTHER">📋 אחר</option>
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">התחלה *</label>
              <input {...register('startTime')} type="datetime-local" className={inp(!!errors.startTime)} />
              {errors.startTime && <p className="text-destructive text-xs mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">סיום</label>
              <input {...register('endTime')} type="datetime-local" className={inp()} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">מיקום</label>
            <input {...register('location')} placeholder="כתובת, Zoom, טלפון..." className={inp()} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">תיאור</label>
            <textarea {...register('description')} rows={2} placeholder="פרטים נוספים..." className={cn(inp(), 'resize-none')} />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">צבע</label>
            <div className="flex items-center gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  )}
                  style={{ background: color }}
                />
              ))}
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
              {isEdit ? 'שמור' : 'צור פגישה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
