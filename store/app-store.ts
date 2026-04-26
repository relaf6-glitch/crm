import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  title: string
  description?: string
  type: 'reminder' | 'task' | 'meeting' | 'system'
  read: boolean
  createdAt: Date
  link?: string
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  removeNotification: (id: string) => void
  unreadCount: () => number

  // Task view
  taskView: 'kanban' | 'list' | 'calendar'
  setTaskView: (view: 'kanban' | 'list' | 'calendar') => void

  // Client view
  clientView: 'grid' | 'list'
  setClientView: (view: 'grid' | 'list') => void

  // Search
  globalSearch: string
  setGlobalSearch: (q: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).substring(2),
              read: false,
              createdAt: new Date(),
            },
            ...s.notifications,
          ].slice(0, 50), // max 50 notifications
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      // Task view
      taskView: 'kanban',
      setTaskView: (taskView) => set({ taskView }),

      // Client view
      clientView: 'grid',
      setClientView: (clientView) => set({ clientView }),

      // Search
      globalSearch: '',
      setGlobalSearch: (globalSearch) => set({ globalSearch }),
    }),
    {
      name: 'crm-app-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        taskView: state.taskView,
        clientView: state.clientView,
      }),
    }
  )
)
