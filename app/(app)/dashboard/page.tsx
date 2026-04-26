import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

async function getDashboardData(userId: string) {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  const [
    totalClients,
    activeClients,
    openTasks,
    urgentTasks,
    overdueTasks,
    upcomingMeetings,
    inactiveClients,
    recentActivity,
    tasksByStatus,
  ] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.client.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.task.count({ where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.task.count({ where: { userId, priority: 'URGENT', status: { in: ['TODO', 'IN_PROGRESS'] } } }),
    prisma.task.count({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] }, dueDate: { lt: now } }
    }),
    prisma.meeting.findMany({
      where: { userId, startTime: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PROSPECT'] },
        OR: [{ lastContact: { lt: thirtyDaysAgo } }, { lastContact: null }],
      },
      orderBy: { lastContact: 'asc' },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { userId },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.task.groupBy({ by: ['status'], where: { userId }, _count: true }),
  ])

  // Monthly data for chart
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      return Promise.all([
        prisma.client.count({
          where: { userId, createdAt: { gte: startOfMonth(month), lte: endOfMonth(month) } }
        }),
        prisma.task.count({
          where: { userId, completedAt: { gte: startOfMonth(month), lte: endOfMonth(month) } }
        }),
      ]).then(([clients, tasks]) => ({
        month: month.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' }),
        clients,
        tasks,
      }))
    })
  )

  return {
    totalClients,
    activeClients,
    openTasks,
    urgentTasks,
    overdueTasks,
    upcomingMeetings,
    inactiveClients,
    recentActivity,
    tasksByStatus: tasksByStatus.map(t => ({ status: t.status, count: t._count })),
    monthlyData,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const data = await getDashboardData(session.user.id)

  return <DashboardClient data={data} userName={session.user.name || 'משתמש'} />
}
