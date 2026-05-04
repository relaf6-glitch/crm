'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Briefcase, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2, 'שם חובה'),
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
     const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }
      toast.success('החשבון נוצר בהצלחה! אפשר להתחבר.')
      router.push('/login')
    } catch (e: any) {
      toast.error(e.message || 'שגיאה ביצירת חשבון')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">מערכת CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">יצירת חשבון חדש</p>
        </div>

        <div className="bg-card border rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold mb-6">הרשמה</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">שם מלא</label>
              <input
                {...register('name')}
                placeholder="ישראל ישראלי"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                  errors.name && 'border-destructive'
                )}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">אימייל</label>
              <input
                {...register('email')}
                type="email"
                dir="ltr"
                placeholder="email@example.com"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                  errors.email && 'border-destructive'
                )}
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="לפחות 6 תווים"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 pe-10',
                    errors.password && 'border-destructive'
                  )}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 end-3 flex items-center text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">אימות סיסמה</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="הזן שוב את הסיסמה"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30',
                  errors.confirmPassword && 'border-destructive'
                )}
              />
              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  צור חשבון
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              כבר יש לך חשבון?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                התחבר כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
