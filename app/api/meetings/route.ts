import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const createMeetingSchema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  clientId: z.string().optional().nullable(),
  type: z.enum(['CALL', 'VIDEO', 'IN_PERSON', 'OTHER']).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  location: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const clientId = searchParams.get('clientId')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {
      userId: session.user.id,
      ...(clientId && { clientId }),
      ...(startDate && endDate && {
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(upcoming && {
        startTime: { gte: new Date() },
      }),
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: upcoming ? 'asc' : 'desc' },
      take: limit,
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('GET /api/meetings error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createMeetingSchema.parse(body)

    const meeting = await prisma.meeting.create({
      data: {
        ...validated,
        userId: session.user.id,
        startTime: new Date(validated.startTime),
        endTime: validated.endTime ? new Date(validated.endTime) : null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Update client's lastContact
    if (meeting.clientId) {
      await prisma.client.update({
        where: { id: meeting.clientId },
        data: { lastContact: new Date() },
      })
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: meeting.clientId,
        type: ActivityType.MEETING_CREATED,
        title: 'פגישה נוצרה',
        description: meeting.title,
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/meetings error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
