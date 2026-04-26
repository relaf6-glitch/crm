import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1, 'שם חובה'),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { clients: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tags)
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
    const validated = createTagSchema.parse(body)

    const tag = await prisma.tag.upsert({
      where: { name_userId: { name: validated.name, userId: session.user.id } },
      update: { color: validated.color },
      create: { ...validated, userId: session.user.id },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'נתונים לא תקינים' }, { status: 400 })
    }
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
