import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { ActivityType } from '@prisma/client'

const createNoteSchema = z.object({
  content: z.string().min(1, 'תוכן חובה'),
  clientId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        ...(clientId && { clientId }),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
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
    const validated = createNoteSchema.parse(body)

    const note = await prisma.note.create({
      data: { ...validated, userId: session.user.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        clientId: note.clientId,
        type: ActivityType.NOTE_CREATED,
        title: 'הערה נוספה',
        description: note.content.substring(0, 60),
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'נתונים לא תקינים' }, { status: 400 })
    }
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'ID חסר' }, { status: 400 })

    await prisma.note.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
