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

  async sendPaymentSuccessEmail(req, res) {
    try {
      const { userId, customUserId, email, name, paymentData } = req.body;

      if (!userId || !customUserId || !email || !name) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Get user details from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const emailSubject = 'Registration Successful - Kumaraguru MUN 2025';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Kumaraguru MUN 2025</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Registration Successful!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #28a745; margin-top: 0;">Welcome to Kumaraguru MUN 2025!</h2>
            
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Congratulations! Your registration for Kumaraguru MUN 2025 has been successfully completed and your payment has been processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Your Login Credentials:</h3>
              <p><strong>User ID:</strong> ${customUserId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${user.password}</p>
              <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login" style="color: #007bff;">${process.env.FRONTEND_URL}/login</a></p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0; color: #1976d2;">Next Steps:</h4>
              <ul style="margin: 10px 0 0 0; color: #1976d2;">
                <li>Login to your dashboard using the credentials above</li>
                <li>Check your committee allocation</li>
                <li>Download your position paper template</li>
                <li>Join the official WhatsApp group for updates</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please save these credentials securely. You will need them to access your dashboard and participate in the conference.</p>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>Need Help?</strong></p>
              <p style="margin: 5px 0 0 0;">Contact us at: <a href="mailto:support@kumaragurumun.com" style="color: #1976d2;">support@kumaragurumun.com</a></p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      const emailText = `
        Kumaraguru MUN 2025 - Registration Successful!
        
        Dear ${name},
        
        Congratulations! Your registration for Kumaraguru MUN 2025 has been successfully completed and your payment has been processed.
        
        Your Login Credentials:
        - User ID: ${customUserId}
        - Email: ${email}
        - Password: ${user.password}
        - Login URL: ${process.env.FRONTEND_URL}/login
        
        Next Steps:
        - Login to your dashboard using the credentials above
        - Check your committee allocation
        - Download your position paper template
        - Join the official WhatsApp group for updates
        
        Important: Please save these credentials securely. You will need them to access your dashboard and participate in the conference.
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Need Help? Contact us at: support@kumaragurumun.com
        
        This is an automated notification. Please do not reply to this email.
      `;

      const result = await emailService.sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        provider: 'outlook'
      });

      if (result.success) {
        return res.json({
          success: true,
          message: 'Payment success email sent successfully',
          data: { messageId: result.messageId }
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send payment success email',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Payment success email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

export default new MailerController();
