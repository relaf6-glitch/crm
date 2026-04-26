'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Sun, Moon, Monitor, User, Bell, Shield, Database, ChevronLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const SECTIONS = [
  { key: 'profile', label: 'פרופיל', icon: User },
  { key: 'appearance', label: 'מראה', icon: Sun },
  { key: 'notifications', label: 'התראות', icon: Bell },
  { key: 'security', label: 'אבטחה', icon: Shield },
  { key: 'data', label: 'נתונים', icon: Database },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState(session?.user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [notifications, setNotifications] = useState({
    emailNotifs: true,
    taskReminders: true,
    meetingReminders: true,
    clientInactive: true,
    overdueAlerts: true,
  })

  useEffect(() => {
    setMounted(true)
    setName(session?.user?.name || '')
  }, [session])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    // Simulated save
    await new Promise(r => setTimeout(r, 800))
    setSavingProfile(false)
    toast.success('הפרופיל עודכן בהצלחה')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground text-sm">ניהול הגדרות המערכת</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    activeSection === s.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                  {activeSection !== s.key && <ChevronLeft className="w-4 h-4 ms-auto opacity-40" />}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card border rounded-xl p-6 animate-fade-in">
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">פרופיל משתמש</h2>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                    {name.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{name || 'שם משתמש'}</p>
                    <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session?.user?.role === 'ADMIN' ? '👑 מנהל מערכת' : '👤 משתמש'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">שם מלא</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">אימייל</label>
                    <input
                      value={session?.user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground mt-1">לא ניתן לשנות אימייל</p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    שמור שינויים
                  </button>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && mounted && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">מראה</h2>

                <div>
                  <label className="text-sm font-medium block mb-3">ערכת צבעים</label>
                  <div className="grid grid-cols-3 gap-3 max-w-xs">
                    {[
                      { value: 'light', label: 'בהיר', icon: Sun },
                      { value: 'dark', label: 'כהה', icon: Moon },
                      { value: 'system', label: 'מערכת', icon: Monitor },
                    ].map(t => {
                      const Icon = t.icon
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTheme(t.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                            theme === t.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Icon className={cn('w-5 h-5', theme === t.value ? 'text-primary' : 'text-muted-foreground')} />
                          <span className={cn('text-xs font-medium', theme === t.value ? 'text-primary' : 'text-muted-foreground')}>
                            {t.label}
                          </span>
                          {theme === t.value && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-3">שפה</label>
                  <select className="px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="he">עברית</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">התראות</h2>

                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'emailNotifs', label: 'התראות אימייל', desc: 'קבל עדכונים לאימייל' },
                    { key: 'taskReminders', label: 'תזכורות משימות', desc: 'תזכורת לפני מועד יעד' },
                    { key: 'meetingReminders', label: 'תזכורות פגישות', desc: 'תזכורת 30 דקות לפני פגישה' },
                    { key: 'clientInactive', label: 'לקוחות לא פעילים', desc: 'התראה על לקוחות ללא קשר 30+ יום' },
                    { key: 'overdueAlerts', label: 'משימות שפגו', desc: 'התראה על משימות שעברו מועד' },
                  ].map(n => (
                    <div key={n.key} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          notifications[n.key as keyof typeof notifications]
                            ? 'bg-primary'
                            : 'bg-muted'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                          notifications[n.key as keyof typeof notifications]
                            ? '-translate-x-1.5'
                            : 'translate-x-1.5'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => toast.success('הגדרות התראות נשמרו')}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  שמור הגדרות
                </button>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">אבטחה</h2>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">סיסמה נוכחית</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">סיסמה חדשה</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">אימות סיסמה חדשה</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <button
                    onClick={() => toast.success('הסיסמה עודכנה בהצלחה')}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    עדכן סיסמה
                  </button>
                </div>

                <div className="border-t pt-5">
                  <h3 className="font-semibold mb-3 text-sm">סשנים פעילים</h3>
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">הדפדפן הנוכחי</p>
                      <p className="text-xs text-muted-foreground">פעיל עכשיו</p>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full font-medium">
                      פעיל
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Data */}
            {activeSection === 'data' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold">נתונים וגיבוי</h2>

                <div className="space-y-3">
                  <div className="p-4 bg-muted/40 rounded-xl border">
                    <h3 className="font-semibold text-sm mb-1">ייצוא נתונים</h3>
                    <p className="text-xs text-muted-foreground mb-3">הורד את כל הנתונים שלך בפורמט JSON</p>
                    <button
                      onClick={() => toast.info('הנתונים מוכנים להורדה')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      ייצא נתונים
                    </button>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border">
                    <h3 className="font-semibold text-sm mb-1">גיבוי אוטומטי</h3>
                    <p className="text-xs text-muted-foreground mb-3">גיבוי אוטומטי יומי מופעל</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <Check className="w-4 h-4" />
                      הגיבוי האחרון: היום
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50">
                    <h3 className="font-semibold text-sm mb-1 text-red-700 dark:text-red-400">מחיקת חשבון</h3>
                    <p className="text-xs text-muted-foreground mb-3">מחיקה בלתי הפיכה של כל הנתונים</p>
                    <button
                      onClick={() => toast.error('פנה לתמיכה למחיקת החשבון')}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      מחק חשבון
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
