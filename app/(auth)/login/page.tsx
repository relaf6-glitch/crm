'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('אנא הזן אימייל תקין'),
  password: z.string().min(1, 'סיסמה חובה'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
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
        toast.error('אימייל או סיסמה שגויים')
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      toast.error('שגיאה לא צפויה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/secretary.jpg"
          alt="המזכירה"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          <h1 className="text-6xl font-bold text-yellow-400 drop-shadow-lg" style={{ fontFamily: 'serif' }}>
            המזכירה
          </h1>
          <p className="text-white/80 text-lg mt-3">מערכת ניהול מקצועית</p>
          <div className="mt-4 w-24 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        </div>
      </div>

      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 bg-zinc-950 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'serif' }}>
              המזכירה
            </h1>
            <p className="text-zinc-400 text-sm">מערכת ניהול מקצועית</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">כניסה למערכת</h2>
            <p className="text-zinc-400 text-sm">ברוכים השבים</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">כתובת אימייל</label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                dir="ltr"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm',
                  'focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-all',
                  'placeholder:text-zinc-600',
                  errors.email && 'border-red-500'
                )}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">סיסמה</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="הזן סיסמה"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm',
                    'focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-all',
                    'placeholder:text-zinc-600 pe-10',
                    errors.password && 'border-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-3 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-yellow-400 text-black hover:bg-yellow-300 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  כניסה
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              אין לך חשבון?{' '}
              <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-medium">
                הירשם כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
