'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(1, 'שם פרטי חובה'),
  lastName: z.string().min(1, 'שם משפחה חובה'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD', 'PROSPECT', 'CHURNED']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClientFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (client: any) => void
  initialData?: any
}

export function ClientFormDialog({ open, onClose, onSuccess, initialData }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'LEAD',
      priority: 'MEDIUM',
    },
  })

  useEffect(() => {
    if (open && initialData) {
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email || '',
        phone: initialData.phone || '',
        company: initialData.company || '',
        address: initialData.address || '',
        status: initialData.status,
        priority: initialData.priority,
        notes: initialData.notes || '',
      })
    } else if (open && !initialData) {
      reset({ status: 'LEAD', priority: 'MEDIUM', firstName: '', lastName: '', email: '', phone: '', company: '', address: '', notes: '' })
    }
  }, [open, initialData, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/clients/${initialData.id}` : '/api/clients'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }
      const client = await res.json()
      toast.success(isEdit ? 'הלקוח עודכן בהצלחה' : 'הלקוח נוצר בהצלחה')
      onSuccess(client)
    } catch (e: any) {
      toast.error(e.message || 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">{isEdit ? 'עריכת לקוח' : 'לקוח חדש'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="שם פרטי *" error={errors.firstName?.message}>
              <input {...register('firstName')} placeholder="ישראל" className={inputClass(!!errors.firstName)} />
            </Field>
            <Field label="שם משפחה *" error={errors.lastName?.message}>
              <input {...register('lastName')} placeholder="ישראלי" className={inputClass(!!errors.lastName)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="אימייל" error={errors.email?.message}>
              <input {...register('email')} type="email" dir="ltr" placeholder="email@example.com" className={inputClass(!!errors.email)} />
            </Field>
            <Field label="טלפון">
              <input {...register('phone')} dir="ltr" placeholder="050-0000000" className={inputClass()} />
            </Field>
          </div>

          <Field label="חברה / ארגון">
            <input {...register('company')} placeholder="שם החברה" className={inputClass()} />
          </Field>

          <Field label="כתובת">
            <input {...register('address')} placeholder="רחוב, עיר" className={inputClass()} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="סטטוס">
              <select {...register('status')} className={inputClass()}>
                <option value="ACTIVE">פעיל</option>
                <option value="INACTIVE">לא פעיל</option>
                <option value="LEAD">ליד</option>
                <option value="PROSPECT">מתעניין</option>
                <option value="CHURNED">עזב</option>
              </select>
            </Field>
            <Field label="עדיפות">
              <select {...register('priority')} className={inputClass()}>
                <option value="HIGH">גבוהה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="LOW">נמוכה</option>
              </select>
            </Field>
          </div>

          <Field label="הערות">
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="הערות כלליות על הלקוח..."
              className={cn(inputClass(), 'resize-none')}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'שמור שינויים' : 'צור לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function inputClass(hasError?: boolean) {
  return cn(
    'w-full px-3 py-2 rounded-xl border bg-background text-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
    'placeholder:text-muted-foreground/70',
    hasError && 'border-destructive focus:ring-destructive/20'
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  )
}
