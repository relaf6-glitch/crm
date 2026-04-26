'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import heLocale from '@fullcalendar/core/locales/he'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { MeetingFormDialog } from '@/components/calendar/meeting-form-dialog'
import { cn, formatDateTime, meetingTypeLabels } from '@/lib/utils'

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editMeeting, setEditMeeting] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detailMeeting, setDetailMeeting] = useState<any>(null)
  const calendarRef = useRef<any>(null)

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings?limit=200')
      const data = await res.json()
      setMeetings(data)
    } catch {
      toast.error('שגיאה בטעינת הפגישות')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMeetings() }, [])

  const calendarEvents = meetings.map(m => ({
    id: m.id,
    title: m.title,
    start: m.startTime,
    end: m.endTime || undefined,
    backgroundColor: m.color || '#6366f1',
    borderColor: m.color || '#6366f1',
    extendedProps: { meeting: m },
  }))

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr)
    setCreateOpen(true)
  }

  const handleEventClick = (info: any) => {
    const meeting = info.event.extendedProps.meeting
    setDetailMeeting(meeting)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק פגישה זו?')) return
    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      setMeetings(ms => ms.filter(m => m.id !== id))
      setDetailMeeting(null)
      toast.success('הפגישה נמחקה')
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">יומן פגישות</h1>
          <p className="text-muted-foreground text-sm">{meetings.length} פגישות</p>
        </div>
        <button
          onClick={() => { setSelectedDate(null); setCreateOpen(true) }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">פגישה חדשה</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-card border rounded-xl p-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={heLocale}
            direction="rtl"
            headerToolbar={{
              start: 'prev,next today',
              center: 'title',
              end: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{
              today: 'היום',
              month: 'חודש',
              week: 'שבוע',
              day: 'יום',
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={n => `+${n} עוד`}
            eventDisplay="block"
            nowIndicator
            editable={false}
            selectable
            eventClassNames="cursor-pointer"
            dayCellClassNames="cursor-pointer hover:bg-muted/30"
          />
        )}
      </div>

      {/* Meeting detail popup */}
      {detailMeeting && (
        <MeetingDetailPanel
          meeting={detailMeeting}
          onClose={() => setDetailMeeting(null)}
          onEdit={() => { setEditMeeting(detailMeeting); setDetailMeeting(null) }}
          onDelete={() => handleDelete(detailMeeting.id)}
        />
      )}

      {/* Create/Edit dialog */}
      <MeetingFormDialog
        open={createOpen}
        defaultDate={selectedDate}
        onClose={() => { setCreateOpen(false); setSelectedDate(null) }}
        onSuccess={(meeting) => {
          setMeetings(ms => [meeting, ...ms.filter(m => m.id !== meeting.id)])
          setCreateOpen(false)
        }}
      />

      {editMeeting && (
        <MeetingFormDialog
          open={!!editMeeting}
          initialData={editMeeting}
          onClose={() => setEditMeeting(null)}
          onSuccess={(updated) => {
            setMeetings(ms => ms.map(m => m.id === updated.id ? updated : m))
            setEditMeeting(null)
          }}
        />
      )}
    </div>
  )
}

function MeetingDetailPanel({ meeting, onClose, onEdit, onDelete }: any) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:bottom-auto lg:left-auto lg:right-8 lg:top-1/2 lg:-translate-y-1/2 lg:w-80 animate-slide-in-right lg:animate-fade-in">
        <div className="bg-card border rounded-t-2xl lg:rounded-2xl shadow-2xl p-5">
          {/* Color bar */}
          <div className="h-1.5 rounded-full mb-4" style={{ background: meeting.color || '#6366f1' }} />

          <h3 className="font-bold text-lg mb-1">{meeting.title}</h3>

          {meeting.client && (
            <p className="text-sm text-primary mb-3">
              {meeting.client.firstName} {meeting.client.lastName}
            </p>
          )}

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatDateTime(meeting.startTime)}</span>
            </div>
            {meeting.endTime && (
              <div className="flex items-center gap-2">
                <span>⏰</span>
                <span>עד {formatDateTime(meeting.endTime)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span>{meetingTypeLabels[meeting.type]}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{meeting.location}</span>
              </div>
            )}
            {meeting.description && (
              <div className="flex items-start gap-2">
                <span>💬</span>
                <span>{meeting.description}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 py-2 rounded-xl border text-sm font-medium hover:bg-accent transition-colors">
              ✏️ עריכה
            </button>
            <button onClick={onDelete} className="flex-1 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
              🗑 מחיקה
            </button>
            <button onClick={onClose} className="py-2 px-3 rounded-xl border text-sm hover:bg-accent transition-colors">
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
