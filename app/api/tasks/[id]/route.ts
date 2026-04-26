import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  category: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        reminders: { where: { isDismissed: false } },
      },
    })

    if (!task) {
      return NextResponse.json({ message: 'משימה לא נמצאה' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'משימה לא נמצאה' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const isCompleting = validated.status === 'DONE' && existing.status !== 'DONE'

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : validated.dueDate === null ? null : undefined,
        completedAt: isCompleting ? new Date() : existing.completedAt,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const activityType = isCompleting ? ActivityType.TASK_COMPLETED : ActivityType.TASK_UPDATED
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: task.clientId,
        type: activityType,
        title: isCompleting ? 'משימה הושלמה' : 'משימה עודכנה',
        description: task.title,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: error.errors },
        { status: 400 }
      )
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

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'משימה לא נמצאה' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        type: ActivityType.TASK_DELETED,
        title: 'משימה נמחקה',
        description: existing.title,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
