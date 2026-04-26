'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus, Search, Filter, Grid, List, Phone, Mail,
  MoreVertical, Trash2, Edit, Eye, Users, SlidersHorizontal
} from 'lucide-react'
import { cn, clientStatusLabels, clientPriorityLabels, getClientStatusClass, formatRelative, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { ClientFormDialog } from '@/components/clients/client-form-dialog'
import { useAppStore } from '@/store/app-store'

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'ACTIVE', label: 'פעיל' },
  { value: 'INACTIVE', label: 'לא פעיל' },
  { value: 'LEAD', label: 'ליד' },
  { value: 'PROSPECT', label: 'מתעניין' },
  { value: 'CHURNED', label: 'עזב' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'כל העדיפויות' },
  { value: 'HIGH', label: 'גבוהה' },
  { value: 'MEDIUM', label: 'בינונית' },
  { value: 'LOW', label: 'נמוכה' },
]

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clientView, setClientView } = useAppStore()

  const [clients, setClients] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(status && { status }),
        ...(priority && { priority }),
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data.clients || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('שגיאה בטעינת הלקוחות')
    } finally {
      setLoading(false)
    }
  }, [search, status, priority, page])

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300)
    return () => clearTimeout(timer)
  }, [fetchClients])

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את הלקוח? פעולה זו אינה הפיכה.')) return
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      toast.success('הלקוח נמחק')
      fetchClients()
    } catch {
      toast.error('שגיאה במחיקת הלקוח')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">לקוחות</h1>
          <p className="text-muted-foreground text-sm">{total} לקוחות בסה"כ</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">לקוח חדש</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="חיפוש לפי שם, טלפון, אימייל..."
            className="w-full bg-background border rounded-xl py-2 pe-9 ps-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors',
            showFilters ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">פילטרים</span>
        </button>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 border rounded-xl p-1">
          <button
            onClick={() => setClientView('grid')}
            className={cn('p-1.5 rounded-lg transition-colors', clientView === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setClientView('list')}
            className={cn('p-1.5 rounded-lg transition-colors', clientView === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/40 rounded-xl border animate-fade-in">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">סטטוס</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">עדיפות</label>
            <select
              value={priority}
              onChange={e => { setPriority(e.target.value); setPage(1) }}
              className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {(status || priority) && (
            <button
              onClick={() => { setStatus(''); setPriority(''); setPage(1) }}
              className="self-end px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-background transition-colors"
            >
              נקה פילטרים
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-1">אין לקוחות</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search || status ? 'לא נמצאו לקוחות התואמים את החיפוש' : 'הוסף את הלקוח הראשון שלך'}
          </p>
          {!search && !status && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              הוסף לקוח
            </button>
          )}
        </div>
      ) : clientView === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">לקוח</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">טלפון</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">חברה</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">סטטוס</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden xl:table-cell">קשר אחרון</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map(client => (
                <tr key={client.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(`${client.firstName} ${client.lastName}`)}
                      </div>
                      <div>
                        <p className="text-sm font-medium hover:text-primary transition-colors">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{client.phone || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">{client.company || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getClientStatusClass(client.status))}>
                      {clientStatusLabels[client.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                    {client.lastContact ? formatRelative(client.lastContact) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/clients/${client.id}`} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition-colors"
          >
            הקודם
          </button>
          <span className="text-sm text-muted-foreground">
            עמוד {page} מתוך {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-accent transition-colors"
          >
            הבא
          </button>
        </div>
      )}

      <ClientFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { fetchClients(); setCreateOpen(false) }}
      />
    </div>
  )
}

function ClientCard({ client, onDelete }: { client: any; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-card border rounded-xl p-4 card-hover group relative">
      <div className="flex items-start justify-between mb-3">
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(`${client.firstName} ${client.lastName}`)}
          </div>
          <div>
            <p className="font-semibold text-sm hover:text-primary transition-colors">
              {client.firstName} {client.lastName}
            </p>
            {client.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
          </div>
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute start-0 top-full mt-1 z-20 bg-card border rounded-xl shadow-lg w-36 py-1 animate-fade-in">
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="w-3.5 h-3.5" /> צפייה
                </Link>
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit className="w-3.5 h-3.5" /> עריכה
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(client.id) }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive w-full"
                >
                  <Trash2 className="w-3.5 h-3.5" /> מחיקה
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {client.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3 shrink-0" />
            <span dir="ltr">{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getClientStatusClass(client.status))}>
          {clientStatusLabels[client.status]}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {client._count?.tasks > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckSquare className="w-3 h-3" />
              {client._count.tasks}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {client.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {client.tags.slice(0, 3).map((ct: any) => (
            <span
              key={ct.tag.id}
              className="px-1.5 py-0.5 rounded text-xs text-white"
              style={{ background: ct.tag.color }}
            >
              {ct.tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
