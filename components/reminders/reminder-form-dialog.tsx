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

export function ReminderFormDialog({
  open,
  onClose,
  onSuccess,
  initialData,
}: ReminderFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const isEdit = !!initialData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CUSTOM' },
  })

  useEffect(() => {
    if (open) {
      fetch('/api/clients?limit=100')
        .then((r) => r.json())
        .then((d) => setClients(d.clients || []))
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
      const url = isEdit
        ? `/api/reminders/${initialData.id}`
        : '/api/reminders'
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

  const inp = (err?: boolean) =>
    cn(
      'w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20
