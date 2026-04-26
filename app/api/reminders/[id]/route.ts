import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'read' | 'dismiss'

    const existing = await prisma.reminder.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ message: 'תזכורת לא נמצאה' }, { status: 404 })
    }

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        ...(action === 'read' && { isRead: true }),
        ...(action === 'dismiss' && { isDismissed: true, isRead: true }),
      },
    })

    return NextResponse.json(reminder)
  } catch (error) {
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

    await prisma.reminder.deleteMany({
      where: { id: params.id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
