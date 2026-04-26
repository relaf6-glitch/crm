import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  type: z.enum(['CALL', 'VIDEO', 'IN_PERSON', 'OTHER']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  color: z.string().optional(),
  notes: z.string().optional().nullable(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const existing = await prisma.meeting.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'פגישה לא נמצאה' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateMeetingSchema.parse(body)

    const meeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        ...validated,
        startTime: validated.startTime ? new Date(validated.startTime) : undefined,
        endTime: validated.endTime ? new Date(validated.endTime) : validated.endTime === null ? null : undefined,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: meeting.clientId,
        type: ActivityType.MEETING_UPDATED,
        title: 'פגישה עודכנה',
        description: meeting.title,
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'נתונים לא תקינים' }, { status: 400 })
    }
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const existing = await prisma.meeting.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'פגישה לא נמצאה' }, { status: 404 })
    }

    await prisma.meeting.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        type: ActivityType.MEETING_DELETED,
        title: 'פגישה נמחקה',
        description: existing.title,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
