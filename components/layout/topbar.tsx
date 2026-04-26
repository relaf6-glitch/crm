'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, Bell, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/store/app-store'
import { cn, formatRelative } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface TopbarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function Topbar({ user }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, notifications, markAllNotificationsRead, unreadCount } = useAppStore()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/clients?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const unread = unreadCount()

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-3 shrink-0 sticky top-0 z-10">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors hidden lg:flex"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search - desktop */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="חיפוש לקוחות, משימות..."
          className={cn(
            'w-full bg-muted/60 rounded-xl pe-9 ps-4 py-2 text-sm',
            'border border-transparent focus:border-primary/30 focus:bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
            'placeholder:text-muted-foreground/70'
          )}
        />
      </form>

      <div className="flex-1" />

      {/* Mobile search toggle */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors md:hidden"
      >
        {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>

      {/* Theme toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifs(!showNotifs)
            if (!showNotifs && unread > 0) markAllNotificationsRead()
          }}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
            <div className={cn(
              'absolute top-full mt-2 end-0 z-20',
              'w-80 bg-card border rounded-xl shadow-xl shadow-black/10',
              'animate-fade-in'
            )}>
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">התראות</span>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    סמן הכל כנקרא
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-auto divide-y">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    אין התראות חדשות
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={cn(
                      'p-3 hover:bg-muted/50 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}>
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        )}
                        <div className={cn(!n.read ? '' : 'ms-3.5')}>
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors">
        {getInitials(user.name || user.email || 'U')}
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <div className="absolute top-full left-0 right-0 bg-card border-b p-3 md:hidden z-20">
          <form onSubmit={handleSearch}>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש..."
              className="w-full bg-muted rounded-xl px-4 py-2 text-sm focus:outline-none"
            />
          </form>
        </div>
      )}
    </header>
  )
}
