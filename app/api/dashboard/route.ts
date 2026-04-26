import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'לא מורשה' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const ninetyDaysAgo = subDays(now, 90)

    const [
      totalClients,
      activeClients,
      totalTasks,
      openTasks,
      urgentTasks,
      overdueTasks,
      upcomingMeetings,
      inactiveLongTime,
      recentActivity,
      monthlyClientsData,
      tasksByStatus,
    ] = await Promise.all([
      // Total clients
      prisma.client.count({ where: { userId } }),

      // Active clients
      prisma.client.count({ where: { userId, status: 'ACTIVE' } }),

      // Total tasks
      prisma.task.count({ where: { userId } }),

      // Open tasks (not done/cancelled)
      prisma.task.count({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      }),

      // Urgent tasks
      prisma.task.count({
        where: { userId, priority: 'URGENT', status: { in: ['TODO', 'IN_PROGRESS'] } },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
      }),

      // Upcoming meetings (next 7 days)
      prisma.meeting.findMany({
        where: {
          userId,
          startTime: { gte: now, lte: subDays(now, -7) },
        },
        include: { client: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),

      // Clients not contacted in 30+ days
      prisma.client.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PROSPECT'] },
          OR: [
            { lastContact: { lt: thirtyDaysAgo } },
            { lastContact: null },
          ],
        },
        orderBy: { lastContact: 'asc' },
        take: 5,
      }),

      // Recent activity
      prisma.activityLog.findMany({
        where: { userId },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Monthly clients data (last 6 months)
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const month = subMonths(now, 5 - i)
          const start = startOfMonth(month)
          const end = endOfMonth(month)
          return prisma.client.count({
            where: { userId, createdAt: { gte: start, lte: end } },
          }).then(count => ({
            month: month.toLocaleDateString('he-IL', { month: 'short' }),
            count,
          }))
        })
      ),

      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ])

    // Upcoming meetings fixed query
    const upcomingMeetingsFixed = await prisma.meeting.findMany({
      where: {
        userId,
        startTime: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startTime: 'asc' },
      take: 5,
    })

    return NextResponse.json({
      totalClients,
      activeClients,
      totalTasks,
      openTasks,
      urgentTasks,
      overdueTasks,
      upcomingMeetings: upcomingMeetingsFixed,
      inactiveLongTime,
      recentActivity,
      monthlyClientsData,
      tasksByStatus: tasksByStatus.map(t => ({
        status: t.status,
        count: t._count,
      })),
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ message: 'שגיאת שרת' }, { status: 500 })
  }
}
