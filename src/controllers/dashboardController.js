import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DashboardController {
  async getStats(req, res) {
    try {
      // Get counts from database
      const [
        totalUsers,
        totalRegistrations,
        confirmedPayments,
        activeCommittees,
        totalContacts,
        pendingContacts
      ] = await Promise.all([
        prisma.user.count(),
        prisma.registration.count(),
        prisma.registration.count({
          where: { paymentStatus: 'COMPLETED' }
        }),
        prisma.committee.count({
          where: { isActive: true }
        }),
        prisma.contact.count(),
        prisma.contact.count({
          where: { status: 'pending' }
        })
      ]);

      // Calculate percentage changes (mock data for now)
      const stats = [
        {
          label: 'Total Users',
          value: totalUsers.toString(),
          change: '+12%',
          icon: 'Users',
          color: 'blue'
        },
        {
          label: 'Total Registrations',
          value: totalRegistrations.toString(),
          change: '+8%',
          icon: 'UserPlus',
          color: 'green'
        },
        {
          label: 'Confirmed Payments',
          value: confirmedPayments.toString(),
          change: '+15%',
          icon: 'CreditCard',
          color: 'purple'
        },
        {
          label: 'Active Committees',
          value: activeCommittees.toString(),
          change: '0%',
          icon: 'FileText',
          color: 'yellow'
        },
        {
          label: 'Contact Submissions',
          value: totalContacts.toString(),
          change: '+5%',
          icon: 'MessageSquare',
          color: 'indigo'
        },
        {
          label: 'Pending Contacts',
          value: pendingContacts.toString(),
          change: '-2%',
          icon: 'Clock',
          color: 'orange'
        }
      ];

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard statistics',
        error: error.message
      });
    }
  }

  async getRecentActivity(req, res) {
    try {
      // Get recent registrations
      const recentRegistrations = await prisma.registration.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          committee: {
            select: {
              name: true
            }
          }
        }
      });

      // Get recent user logins
      const recentLogins = await prisma.user.findMany({
        where: {
          lastLogin: {
            not: null
          }
        },
        take: 10,
        orderBy: { lastLogin: 'desc' },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          lastLogin: true,
          role: true
        }
      });

      const activities = [
        ...recentRegistrations.map(reg => ({
          type: 'registration',
          user: `${reg.user.firstName} ${reg.user.lastName}`,
          action: 'submitted registration',
          timestamp: reg.createdAt,
          details: reg.committee?.name || 'Unknown Committee'
        })),
        ...recentLogins.map(user => ({
          type: 'login',
          user: `${user.firstName} ${user.lastName}`,
          action: 'logged in',
          timestamp: user.lastLogin,
          details: user.role
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
       .slice(0, 20);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent activity',
        error: error.message
      });
    }
  }
}

export default new DashboardController();
