import emailService from '../services/emailService.js';
import { prisma } from '../config/database.js';

class MailerController {
  async sendBulkEmail(req, res) {
    try {
      const { recipientType, recipients, singleEmail, emailProvider, subject, message } = req.body;

      // Validate required fields
      if (!subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Subject and message are required'
        });
      }

      let emailRecipients = [];

      if (recipientType === 'single') {
        if (!singleEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email address is required for single recipient'
          });
        }
        emailRecipients = [{ email: singleEmail }];
      } else {
        // Get recipients based on selected committees
        const whereClause = {};
        
        if (recipients.includes('all')) {
          // Get all registered users
          whereClause.role = 'DELEGATE';
        } else {
          // Get users by committee preferences
          const committeeConditions = recipients.map(committee => ({
            OR: [
              { committeePreference1: committee.toUpperCase() },
              { committeePreference2: committee.toUpperCase() },
              { committeePreference3: committee.toUpperCase() }
            ]
          }));
          
          whereClause.AND = [
            { role: 'DELEGATE' },
            { OR: committeeConditions }
          ];
        }

        const users = await prisma.user.findMany({
          where: whereClause,
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        });

        emailRecipients = users;
      }

      if (emailRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recipients found for the selected criteria'
        });
      }

      // Send bulk email
      const result = await emailService.sendBulkEmail(
        emailRecipients,
        subject,
        message,
        emailProvider,
        recipientType === 'single' ? 'SINGLE' : 'BULK'
      );

      if (result.success) {
        // Log the email activity
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: 'SEND_BULK_EMAIL',
            details: {
              recipientType,
              recipientCount: emailRecipients.length,
              subject,
              emailProvider,
              successCount: result.totalSent,
              failureCount: result.totalFailed
            }
          }
        });

        return res.json({
          success: true,
          message: `Email sent successfully to ${result.totalSent} recipients`,
          data: {
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            recipients: emailRecipients.length
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send email',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Bulk email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  async getEmailRecipients(req, res) {
    try {
      const { committee } = req.query;

      let whereClause = { role: 'DELEGATE' };

      if (committee && committee !== 'all') {
        const committeeConditions = [
          { committeePreference1: committee.toUpperCase() },
          { committeePreference2: committee.toUpperCase() },
          { committeePreference3: committee.toUpperCase() }
        ];
        
        whereClause.OR = committeeConditions;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          institution: true,
          committeePreference1: true,
          committeePreference2: true,
          committeePreference3: true
        }
      });

      return res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get recipients error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recipients',
        error: error.message
      });
    }
  }

  async getEmailStats(req, res) {
    try {
      const totalUsers = await prisma.user.count({
        where: { role: 'DELEGATE' }
      });

      const committeeStats = await prisma.user.groupBy({
        by: ['committeePreference1'],
        where: { 
          role: 'DELEGATE',
          committeePreference1: { not: null }
        },
        _count: {
          committeePreference1: true
        }
      });

      const stats = {
        totalRegistrants: totalUsers,
        committeeBreakdown: committeeStats.map(stat => ({
          committee: stat.committeePreference1,
          count: stat._count.committeePreference1
        }))
      };

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get email stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email statistics',
        error: error.message
      });
    }
  }

  async sendTestEmail(req, res) {
    try {
      const { email, subject, message } = req.body;

      if (!email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Email, subject, and message are required'
        });
      }

      const result = await emailService.sendEmail({
        to: email,
        subject,
        html: message,
        text: message.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        provider: 'gmail' // Default to Gmail for test emails
      });

      if (result.success) {
        return res.json({
          success: true,
          message: 'Test email sent successfully',
          data: { messageId: result.messageId }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send test email',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

export default new MailerController();
