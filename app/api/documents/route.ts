import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        ...(clientId && { clientId }),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
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
    const { name, originalName, url, size, mimeType, type, clientId } = body

    const document = await prisma.document.create({
      data: {
        name,
        originalName,
        url,
        size: size || 0,
        mimeType: mimeType || 'application/octet-stream',
        type: type || 'OTHER',
        userId: session.user.id,
        clientId: clientId || null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
