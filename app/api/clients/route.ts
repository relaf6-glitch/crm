import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const createClientSchema = z.object({
  firstName: z.string().min(1, 'שם פרטי חובה'),
  lastName: z.string().min(1, 'שם משפחה חובה'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD', 'PROSPECT', 'CHURNED']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const tag = searchParams.get('tag') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(tag && {
        tags: {
          some: { tag: { name: tag } },
        },
      }),
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: {
            select: { tasks: true, meetings: true, documents: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/clients error:', error)
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
    const validated = createClientSchema.parse(body)

    const { tags, ...clientData } = validated

    const client = await prisma.client.create({
      data: {
        ...clientData,
        email: clientData.email || null,
        userId: session.user.id,
        lastContact: new Date(),
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map(tagId => ({ tagId })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: client.id,
        type: ActivityType.CLIENT_CREATED,
        title: 'לקוח חדש נוצר',
        description: `${client.firstName} ${client.lastName} התווסף למערכת`,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'נתונים לא תקינים', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('POST /api/clients error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
