import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ClientDetailClient } from '@/components/clients/client-detail-client'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      tags: { include: { tag: true } },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 20,
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

  if (!client) notFound()

  return <ClientDetailClient client={client} />
}
