'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, Trash2, Download, Search, File, Image, FileArchive } from 'lucide-react'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_ICONS: Record<string, any> = {
  PDF: FileText,
  WORD: FileText,
  IMAGE: Image,
  OTHER: File,
}

const TYPE_COLORS: Record<string, string> = {
  PDF: 'text-red-500',
  WORD: 'text-blue-500',
  IMAGE: 'text-green-500',
  OTHER: 'text-gray-500',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data)
    } catch {
      // Silently handle if endpoint doesn't exist yet
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocuments() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    toast.info('מעלה קובץ...')

    // Simulate upload (in real app, upload to S3/Cloudinary/etc)
    setTimeout(() => {
      const mockDoc = {
        id: Math.random().toString(36).substr(2),
        name: file.name,
        originalName: file.name,
        url: '#',
        size: file.size,
        mimeType: file.type,
        type: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'IMAGE' : 'OTHER',
        createdAt: new Date().toISOString(),
        client: null,
      }
      setDocuments(docs => [mockDoc, ...docs])
      setUploading(false)
      toast.success('הקובץ הועלה בהצלחה')
    }, 1500)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק מסמך זה?')) return
    setDocuments(docs => docs.filter(d => d.id !== id))
    toast.success('המסמך נמחק')
  }

  const filtered = documents.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.client?.firstName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">מסמכים וקבצים</h1>
          <p className="text-muted-foreground text-sm">{documents.length} קבצים</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{uploading ? 'מעלה...' : 'העלה קובץ'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש קבצים..."
          className="w-full bg-background border rounded-xl py-2 pe-9 ps-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          'hover:border-primary/50 hover:bg-primary/5',
          'text-muted-foreground'
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">גרור קבצים לכאן או לחץ להעלאה</p>
        <p className="text-xs mt-1">PDF, Word, תמונות עד 10MB</p>
      </div>

      {/* Documents grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded mb-3 mx-auto" />
              <div className="h-3 bg-muted rounded mb-1" />
              <div className="h-2 bg-muted rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileArchive className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-1">אין מסמכים</h3>
          <p className="text-muted-foreground text-sm">העלה קבצים כדי לנהל אותם כאן</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(doc => {
            const Icon = TYPE_ICONS[doc.type] || File
            const iconColor = TYPE_COLORS[doc.type] || 'text-gray-500'

            return (
              <div key={doc.id} className="bg-card border rounded-xl p-4 group card-hover relative">
                <div className={cn('flex items-center justify-center mb-3', iconColor)}>
                  <Icon className="w-10 h-10" />
                </div>
                <p className="text-xs font-medium text-center truncate" title={doc.name}>{doc.name}</p>
                <p className="text-xs text-muted-foreground text-center mt-0.5">
                  {formatFileSize(doc.size)}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {formatDate(doc.createdAt)}
                </p>
                {doc.client && (
                  <p className="text-xs text-primary text-center mt-1 truncate">
                    {doc.client.firstName} {doc.client.lastName}
                  </p>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.url}
                    target="_blank"
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    title="הורד"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 bg-white/20 hover:bg-red-500/70 rounded-lg text-white transition-colors"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
