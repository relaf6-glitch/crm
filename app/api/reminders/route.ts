import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createReminderSchema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  type: z.enum(['TASK', 'MEETING', 'CLIENT', 'CUSTOM']).optional(),
  remindAt: z.string().datetime(),
  clientId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  meetingId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
      isDismissed: false,
      ...(unreadOnly && { isRead: false }),
      ...(upcoming && { remindAt: { gte: new Date() } }),
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true } },
        meeting: { select: { id: true, title: true } },
      },
      orderBy: { remindAt: 'asc' },
      take: limit,
    })

    return NextResponse.json(reminders)
  } catch (error) {
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
    const validated = createReminderSchema.parse(body)

    const reminder = await prisma.reminder.create({
      data: {
        ...validated,
        userId: session.user.id,
        remindAt: new Date(validated.remindAt),
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'נתונים לא תקינים' }, { status: 400 })
    }
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
