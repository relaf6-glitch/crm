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
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col items-center justify-center relative overflow-hidden">
        {/* Gold decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        <div className="absolute top-8 left-8 w-16 h-16 border border-yellow-400/30 rounded-full" />
        <div className="absolute bottom-8 right-8 w-24 h-24 border border-yellow-400/20 rounded-full" />

        {/* Secretary illustration */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-48 h-48 mb-8">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Desk */}
              <rect x="20" y="150" width="160" height="8" rx="2" fill="#B8860B" />
              <rect x="30" y="158" width="8" height="30" rx="2" fill="#8B6914" />
              <rect x="162" y="158" width="8" height="30" rx="2" fill="#8B6914" />
              {/* Monitor */}
              <rect x="70" y="100" width="70" height="50" rx="4" fill="#1a1a1a" stroke="#B8860B" strokeWidth="2" />
              <rect x="75" y="105" width="60" height="38" rx="2" fill="#0a0a2e" />
              <rect x="95" y="150" width="20" height="6" fill="#1a1a1a" />
              <rect x="88" y="156" width="34" height="3" rx="1" fill="#B8860B" />
              {/* Screen glow */}
              <rect x="78" y="108" width="54" height="32" rx="1" fill="#1a3a6e" opacity="0.6" />
              <line x1="82" y1="116" x2="120" y2="116" stroke="#B8860B" strokeWidth="1.5" opacity="0.7" />
              <line x1="82" y1="122" x2="112" y2="122" stroke="#B8860B" strokeWidth="1.5" opacity="0.7" />
              <line x1="82" y1="128" x2="116" y2="128" stroke="#B8860B" strokeWidth="1.5" opacity="0.7" />
              {/* Person body */}
              <rect x="82" y="72" width="36" height="30" rx="4" fill="#2d2d2d" />
              {/* Collar/jacket */}
              <path d="M82 80 L100 90 L118 80" stroke="#B8860B" strokeWidth="1.5" fill="none" />
              {/* Head */}
              <circle cx="100" cy="58" r="16" fill="#D4A574" />
              {/* Hair */}
              <path d="M84 52 Q100 38 116 52 Q116 44 100 40 Q84 44 84 52" fill="#1a1a1a" />
              {/* Eyes */}
              <circle cx="94" cy="56" r="2" fill="#1a1a1a" />
              <circle cx="106" cy="56" r="2" fill="#1a1a1a" />
              {/* Smile */}
              <path d="M94 64 Q100 68 106 64" stroke="#8B4513" strokeWidth="1.5" fill="none" />
              {/* Earring */}
              <circle cx="84" cy="60" r="2" fill="#B8860B" />
              <circle cx="116" cy="60" r="2" fill="#B8860B" />
              {/* Arms */}
              <rect x="60" y="80" width="22" height="10" rx="5" fill="#2d2d2d" transform="rotate(-20 60 80)" />
              <rect x="118" y="80" width="22" height="10" rx="5" fill="#2d2d2d" transform="rotate(20 140 80)" />
              {/* Hands on keyboard */}
              <ellipse cx="68" cy="148" rx="10" ry="5" fill="#D4A574" />
              <ellipse cx="132" cy="148" rx="10" ry="5" fill="#D4A574" />
              {/* Keyboard */}
              <rect x="55" y="145" width="90" height="12" rx="3" fill="#1a1a1a" stroke="#B8860B" strokeWidth="1" />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-yellow-400 mb-3" style={{ fontFamily: 'serif' }}>
            המזכירה
          </h1>
          <p className="text-zinc-400 text-lg text-center px-8">
            מערכת ניהול מקצועית
          </p>
          <p className="text-zinc-500 text-sm text-center mt-2 px-8">
            לקוחות · משימות · פגישות · תזכורות
          </p>

          {/* Gold divider */}
          <div className="mt-6 w-24 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
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
