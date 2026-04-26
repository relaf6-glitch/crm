import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { he } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: he })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he })
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'HH:mm', { locale: he })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: he })
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return isBefore(new Date(date), new Date())
}

export function isDueToday(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  return isAfter(d, startOfDay(new Date())) && isBefore(d, endOfDay(new Date()))
}

// ─── Label Translations ───────────────────────────────────────────────────────

export const clientStatusLabels: Record<string, string> = {
  ACTIVE: 'פעיל',
  INACTIVE: 'לא פעיל',
  LEAD: 'ליד',
  PROSPECT: 'מתעניין',
  CHURNED: 'עזב',
}

export const clientPriorityLabels: Record<string, string> = {
  HIGH: 'גבוהה',
  MEDIUM: 'בינונית',
  LOW: 'נמוכה',
}

export const taskStatusLabels: Record<string, string> = {
  TODO: 'לביצוע',
  IN_PROGRESS: 'בתהליך',
  DONE: 'הושלם',
  CANCELLED: 'בוטל',
}

export const taskPriorityLabels: Record<string, string> = {
  URGENT: 'דחוף',
  HIGH: 'גבוה',
  MEDIUM: 'בינוני',
  LOW: 'נמוך',
}

export const meetingTypeLabels: Record<string, string> = {
  CALL: 'שיחת טלפון',
  VIDEO: 'וידאו קול',
  IN_PERSON: 'פגישה פיזית',
  OTHER: 'אחר',
}

export const reminderTypeLabels: Record<string, string> = {
  TASK: 'משימה',
  MEETING: 'פגישה',
  CLIENT: 'לקוח',
  CUSTOM: 'מותאם אישית',
}

export const activityTypeLabels: Record<string, string> = {
  CLIENT_CREATED: 'לקוח חדש',
  CLIENT_UPDATED: 'עדכון לקוח',
  CLIENT_DELETED: 'מחיקת לקוח',
  TASK_CREATED: 'משימה חדשה',
  TASK_UPDATED: 'עדכון משימה',
  TASK_COMPLETED: 'משימה הושלמה',
  TASK_DELETED: 'מחיקת משימה',
  MEETING_CREATED: 'פגישה חדשה',
  MEETING_UPDATED: 'עדכון פגישה',
  MEETING_DELETED: 'מחיקת פגישה',
  NOTE_CREATED: 'הערה חדשה',
  NOTE_DELETED: 'מחיקת הערה',
  DOCUMENT_UPLOADED: 'מסמך הועלה',
  REMINDER_CREATED: 'תזכורת חדשה',
}

// ─── Status Color Classes ─────────────────────────────────────────────────────

export function getClientStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    LEAD: 'status-lead',
    PROSPECT: 'status-prospect',
    CHURNED: 'status-churned',
  }
  return map[status] ?? 'status-inactive'
}

export function getTaskPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    URGENT: 'priority-urgent',
    HIGH: 'priority-high',
    MEDIUM: 'priority-medium',
    LOW: 'priority-low',
  }
  return map[priority] ?? 'priority-low'
}

export function getTaskStatusClass(status: string): string {
  const map: Record<string, string> = {
    TODO: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
    IN_PROGRESS: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    DONE: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
    CANCELLED: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
  }
  return map[status] ?? ''
}

// ─── Number Utilities ─────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'שגיאה לא צפויה' }))
    throw new Error(error.message || `HTTP error ${res.status}`)
  }

  return res.json()
}
