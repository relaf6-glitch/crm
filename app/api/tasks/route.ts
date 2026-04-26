import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const createTaskSchema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  description: z.string().optional(),
  clientId: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  category: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const clientId = searchParams.get('clientId')
    const overdue = searchParams.get('overdue') === 'true'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(clientId && { clientId }),
      ...(overdue && {
        dueDate: { lt: new Date() },
        status: { notIn: ['DONE', 'CANCELLED'] },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/tasks error:', error)
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
    const validated = createTaskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        ...validated,
        userId: session.user.id,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: task.clientId,
        type: ActivityType.TASK_CREATED,
        title: 'משימה חדשה',
        description: task.title,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
