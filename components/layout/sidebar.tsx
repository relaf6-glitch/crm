'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import {
  LayoutDashboard, Users, CheckSquare, Calendar,
  Bell, FileText, Settings, LogOut, Menu, X,
  Briefcase, ChevronRight
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/clients', label: 'לקוחות', icon: Users },
  { href: '/tasks', label: 'משימות', icon: CheckSquare },
  { href: '/calendar', label: 'יומן', icon: Calendar },
  { href: '/reminders', label: 'תזכורות', icon: Bell },
  { href: '/documents', label: 'מסמכים', icon: FileText },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 right-0 z-30 lg:z-auto',
          'flex flex-col bg-card border-l h-full',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-[260px]' : 'w-0 lg:w-[72px]',
          'overflow-hidden'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-foreground">CRM Pro</span>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors',
              !sidebarOpen && 'hidden lg:flex'
            )}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sidebar-item',
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-white' : '')} />
                {sidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
                {sidebarOpen && isActive && (
                  <ChevronRight className="w-4 h-4 ms-auto opacity-70" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className={cn('border-t p-3 shrink-0')}>
          <div className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg',
            sidebarOpen ? '' : 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {getInitials(user.name || user.email || 'U')}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'sidebar-item sidebar-item-inactive w-full mt-1 text-destructive hover:text-destructive hover:bg-destructive/10',
              !sidebarOpen && 'justify-center px-2'
            )}
            title={!sidebarOpen ? 'יציאה' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>יציאה</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
