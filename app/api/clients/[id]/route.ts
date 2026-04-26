import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const updateClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD', 'PROSPECT', 'CHURNED']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lastContact: z.string().datetime().optional(),
})

async function getClientOrFail(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  })
  if (!client) return null
  return client
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const client = await prisma.client.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        tags: { include: { tag: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        meetings: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        clientNotes: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          where: { isDismissed: false },
          orderBy: { remindAt: 'asc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { tasks: true, meetings: true, documents: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ message: 'לקוח לא נמצא' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error)
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

    const existing = await getClientOrFail(params.id, session.user.id)
    if (!existing) {
      return NextResponse.json({ message: 'לקוח לא נמצא' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateClientSchema.parse(body)
    const { tags, ...clientData } = validated

    // Handle tags update
    if (tags !== undefined) {
      await prisma.clientTag.deleteMany({ where: { clientId: params.id } })
      if (tags.length > 0) {
        await prisma.clientTag.createMany({
          data: tags.map(tagId => ({ clientId: params.id, tagId })),
          skipDuplicates: true,
        })
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...clientData,
        email: clientData.email || null,
      },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { tasks: true, meetings: true, documents: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: client.id,
        type: ActivityType.CLIENT_UPDATED,
        title: 'לקוח עודכן',
        description: `פרטי ${client.firstName} ${client.lastName} עודכנו`,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT /api/clients/[id] error:', error)
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

    const existing = await getClientOrFail(params.id, session.user.id)
    if (!existing) {
      return NextResponse.json({ message: 'לקוח לא נמצא' }, { status: 404 })
    }

    await prisma.client.delete({ where: { id: params.id } })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        type: ActivityType.CLIENT_DELETED,
        title: 'לקוח נמחק',
        description: `${existing.firstName} ${existing.lastName} נמחק מהמערכת`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
