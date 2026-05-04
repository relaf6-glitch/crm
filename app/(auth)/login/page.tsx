'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Briefcase, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('אנא הזן אימייל תקין'),
  password: z.string().min(1, 'סיסמה חובה'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('שגיאת התחברות', { description: 'אימייל או סיסמה שגויים' })
      } else {
        toast.success('התחברת בהצלחה!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('שגיאה לא צפויה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">מערכת CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">ניהול לקוחות ומשימות מקצועי</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border rounded-2xl shadow-xl shadow-black/5 p-8 animate-fade-in animation-delay-100">
          <h2 className="text-xl font-semibold mb-6">התחברות למערכת</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">כתובת אימייל</label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                dir="ltr"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'placeholder:text-muted-foreground',
                  errors.email && 'border-destructive focus:ring-destructive/30'
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
                  placeholder="הזן סיסמה"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border bg-background text-sm transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    'placeholder:text-muted-foreground pe-10',
                    errors.password && 'border-destructive focus:ring-destructive/30'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  כניסה למערכת
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center">
            <p className="text-sm text-muted-foreground">
              אין לך חשבון עדיין?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                הירשם כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
