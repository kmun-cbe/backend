import { prisma } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fileUploadService from '../services/fileUploadService.js';
import emailService from '../services/emailService.js';
import paymentService from '../services/paymentService.js';
import userIdService from '../services/userIdService.js';

class RegistrationController {
  async testConnection(req, res) {
    try {
      const count = await prisma.registrationForm.count();
      res.json({
        success: true,
        message: 'Database connection successful',
        count: count
      });
    } catch (error) {
      console.error('Database connection test error:', error);
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  }

  async createRegistration(req, res) {
    try {
      console.log('Registration request body:', req.body);
      console.log('Registration request files:', req.files);

      const {
        fullName,
        email,
        phone,
        gender,
        isKumaraguru,
        rollNumber,
        institutionType,
        institution,
        cityOfInstitution,
        stateOfInstitution,
        grade,
        totalMuns,
        requiresAccommodation,
        committeePreference1,
        portfolioPreference1,
        committeePreference2,
        portfolioPreference2,
        committeePreference3,
        portfolioPreference3,
      } = req.body;

      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Validate required fields
      if (!fullName || !email || !phone || !gender || !committeePreference1) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          required: ['fullName', 'email', 'phone', 'gender', 'committeePreference1']
        });
      }

      // Validate required files
      if (!req.files || !req.files.idDocument) {
        return res.status(400).json({
          success: false,
          message: 'ID document is required',
        });
      }

      // Check if user already exists
      let user = await prisma.user.findFirst({ where: { email } });
      let isNewUser = false;
      let userPassword = null;
      
      if (user) {
        console.log('User already exists, using existing user:', user.id);
        // Update user information if needed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName,
            lastName,
            phone,
          },
        });
      } else {
        isNewUser = true;
        // Generate custom user ID for new user
        const customUserId = await userIdService.generateUserId();
        console.log('Generated custom user ID:', customUserId);

        // Generate custom password: Iam<phone number (trimmed)>!@#
        const trimmedPhone = phone.replace(/\D/g, ''); // Remove all non-digits
        userPassword = `Iam${trimmedPhone}!@#`;
        const hashedPassword = await bcrypt.hash(userPassword, 12);

        user = await prisma.user.create({
          data: {
            userId: customUserId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            role: 'DELEGATE',
          },
        });
      }

      // Check if user already has a registration form
      let registration = await prisma.registrationForm.findFirst({
        where: { userId: user.id }
      });

      if (registration) {
        console.log('User already has a registration form, updating existing one:', registration.id);
        // Update existing registration form
        registration = await prisma.registrationForm.update({
          where: { id: registration.id },
          data: {
            firstName,
            lastName,
            email,
            phone,
            gender,
            isKumaraguru: isKumaraguru === 'yes',
            rollNumber,
            institutionType,
            institution,
            cityOfInstitution,
            stateOfInstitution,
            grade,
            totalMuns: parseInt(totalMuns) || 0,
            requiresAccommodation: requiresAccommodation === 'yes',
            committeePreference1,
            portfolioPreference1: portfolioPreference1 || '',
            committeePreference2,
            portfolioPreference2: portfolioPreference2 || '',
            committeePreference3,
            portfolioPreference3: portfolioPreference3 || '',
            idDocument: req.files.idDocument[0].path,
            munResume: req.files.munResume ? req.files.munResume[0].path : null,
            status: 'PENDING', // Reset status to pending for updated registration
          },
        });
      } else {
        // Create new registration form
        registration = await prisma.registrationForm.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            email,
            phone,
            gender,
            isKumaraguru: isKumaraguru === 'yes',
            rollNumber,
            institutionType,
            institution,
            cityOfInstitution,
            stateOfInstitution,
            grade,
            totalMuns: parseInt(totalMuns) || 0,
            requiresAccommodation: requiresAccommodation === 'yes',
            committeePreference1,
            portfolioPreference1: portfolioPreference1 || '',
            committeePreference2,
            portfolioPreference2: portfolioPreference2 || '',
            committeePreference3,
            portfolioPreference3: portfolioPreference3 || '',
            idDocument: req.files.idDocument[0].path,
            munResume: req.files.munResume ? req.files.munResume[0].path : null,
          },
        });
      }

      // Generate JWT token for immediate authentication
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send registration confirmation email using Outlook SMTP
      await emailService.sendRegistrationConfirmation(email, {
        firstName,
        lastName,
        email,
        registrationId: registration.id,
        userId: user.userId,
        transactionId: `TXN-${registration.id.slice(-8).toUpperCase()}`, // Generate transaction ID
        paymentAmount: 150, // Base registration fee
        institution: institution || 'N/A',
        committeePreference1,
        committeePreference2,
        committeePreference3,
      }, 'outlook');

      // Send welcome email for new users with login credentials
      if (isNewUser && userPassword) {
        try {
          await emailService.sendWelcomeEmail(email, {
            firstName,
            lastName,
            email,
            password: userPassword,
            role: 'DELEGATE'
          }, 'outlook');
        } catch (welcomeEmailError) {
          console.error('Failed to send welcome email:', welcomeEmailError);
          // Don't fail the registration if welcome email fails
        }
      }

      res.status(201).json({
        success: true,
        message: 'Registration submitted successfully',
        registration: {
          id: registration.id,
          status: registration.status,
          submittedAt: registration.submittedAt,
        },
        user: {
          id: user.id,
          userId: user.userId,
          email: user.email,
          tempPassword: isNewUser ? userPassword : undefined, // Only include temp password for new users
        },
        token, // Include JWT token for immediate authentication
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  async getRegistrations(req, res) {
    try {
      console.log('Starting getRegistrations...');
      console.log('Request headers:', req.headers);
      console.log('Request user:', req.user);
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }
      
      // First, test basic database connection
      const totalCount = await prisma.registrationForm.count();
      console.log(`Total registrations in database: ${totalCount}`);

      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'submittedAt',
        sortOrder = 'desc',
      } = req.query;

      console.log('Get registrations query params:', { page, limit, status, search, sortBy, sortOrder });

      const offset = (page - 1) * limit;
      const where = {};

      // Normalize sort order to lowercase (Prisma expects 'asc' or 'desc')
      const normalizedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

      // Apply filters
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { institution: { contains: search, mode: 'insensitive' } },
        ];
      }

      console.log('Where clause:', where);

      // Validate sortBy field
      const validSortFields = ['submittedAt', 'createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

      // Get registrations with simple query first
      const registrations = await prisma.registrationForm.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: {
          [finalSortBy]: normalizedSortOrder,
        },
      });

      console.log(`Found ${registrations.length} registrations`);

      // Get total count
      const total = await prisma.registrationForm.count({ where });

      // Add user data to each registration
      const registrationsWithUsers = registrations.map(registration => ({
        ...registration,
        user: {
          id: registration.userId,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          phone: registration.phone,
          userId: null, // This would need to be fetched separately if needed
        }
      }));

      console.log(`Returning ${registrationsWithUsers.length} registrations with user data`);

      res.status(200).json({
        success: true,
        data: {
          registrations: registrationsWithUsers,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Get registrations error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to get registrations',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getMyRegistration(req, res) {
    try {
      const userId = req.user.id;

      const registration = await prisma.registrationForm.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              userId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'No registration found for this user',
        });
      }

      res.json({
        success: true,
        registration,
      });
    } catch (error) {
      console.error('Get my registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get registration',
        error: error.message,
      });
    }
  }

  async getRegistrationById(req, res) {
    try {
      const { id } = req.params;

      const registration = await prisma.registrationForm.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
      }

      res.json({
        success: true,
        registration,
      });
    } catch (error) {
      console.error('Get registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get registration',
        error: error.message,
      });
    }
  }

  async updateRegistrationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, allocatedCommittee, allocatedPortfolio } = req.body;

      const registration = await prisma.registrationForm.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
      }

      const updatedRegistration = await prisma.registrationForm.update({
        where: { id },
        data: {
          status,
          allocatedCommittee,
          allocatedPortfolio,
        },
        include: { user: true },
      });

      // Send allocation email if committee is allocated
      if (allocatedCommittee && allocatedPortfolio) {
        await emailService.sendCommitteeAllocation(registration.user.email, {
          firstName: registration.firstName,
          lastName: registration.lastName,
          committee: allocatedCommittee,
          portfolio: allocatedPortfolio,
        });
      }

      res.json({
        success: true,
        message: 'Registration updated successfully',
        registration: updatedRegistration,
      });
    } catch (error) {
      console.error('Update registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update registration',
        error: error.message,
      });
    }
  }

  async deleteRegistration(req, res) {
    try {
      const { id } = req.params;

      // Get registration with user details for email
      const registration = await prisma.registrationForm.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              userId: true
            }
          }
        }
      });
      
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
      }

      const userEmail = registration.user.email;
      const userName = `${registration.user.firstName} ${registration.user.lastName}`;
      const userCustomId = registration.user.userId;

      // Send deletion notification email via Outlook
      try {
        const emailService = (await import('../services/emailService.js')).default;
        
        const emailSubject = 'Registration Deletion Notification - Kumaraguru MUN 2025';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Kumaraguru MUN 2025</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Registration Deletion Notification</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #dc3545; margin-top: 0;">Registration Deleted</h2>
              
              <p>Dear <strong>${userName}</strong> (${userCustomId}),</p>
              
              <p>We regret to inform you that your registration for Kumaraguru MUN 2025 has been deleted from our system.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #dc3545;">Registration Details:</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>User ID:</strong> ${userCustomId}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Deletion Date:</strong> ${new Date().toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              <p>If you believe this deletion was made in error, please contact our support team immediately.</p>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;"><strong>Need Help?</strong></p>
                <p style="margin: 5px 0 0 0;">Contact us at: <a href="mailto:mun@kct.ac.in" style="color: #1976d2;">mun@kct.ac.in</a></p>
              </div>
              
              <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        `;

        const emailText = `
          Kumaraguru MUN 2025 - Registration Deletion Notification
          
          Dear ${userName} (${userCustomId}),
          
          We regret to inform you that your registration for Kumaraguru MUN 2025 has been deleted from our system.
          
          Registration Details:
          - Name: ${userName}
          - User ID: ${userCustomId}
          - Email: ${userEmail}
          - Deletion Date: ${new Date().toLocaleDateString('en-IN')}
          
          If you believe this deletion was made in error, please contact our support team immediately.
          
          Need Help? Contact us at: support@kumaragurumun.com
          
          This is an automated notification. Please do not reply to this email.
        `;

        await emailService.sendEmail({
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          provider: 'outlook'
        });

        console.log(`Deletion notification email sent to ${userEmail} via Outlook`);
      } catch (emailError) {
        console.error('Failed to send deletion notification email:', emailError);
        // Continue with deletion even if email fails
      }

      // Delete associated files
      if (registration.idDocument) {
        await fileUploadService.deleteFile(registration.idDocument);
      }
      if (registration.munResume) {
        await fileUploadService.deleteFile(registration.munResume);
      }

      // Delete all related records in the correct order to avoid foreign key constraints
      console.log(`Deleting all related records for user ${userName} (${userCustomId})...`);

      // 1. Delete payments (references registrationId and userId)
      const deletedPayments = await prisma.payment.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedPayments.count} payment records`);

      // 2. Delete activity logs (references userId)
      const deletedActivityLogs = await prisma.activityLog.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedActivityLogs.count} activity log records`);

      // 3. Delete marks (references userId)
      const deletedMarks = await prisma.mark.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedMarks.count} mark records`);

      // 4. Delete attendance records (references userId)
      const deletedAttendanceRecords = await prisma.attendanceRecord.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedAttendanceRecords.count} attendance records`);

      // 5. Delete check-ins (references userId)
      const deletedCheckIns = await prisma.checkIn.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedCheckIns.count} check-in records`);

      // 6. Delete registrations (references userId)
      const deletedRegistrations = await prisma.registration.deleteMany({
        where: { userId: registration.userId }
      });
      console.log(`Deleted ${deletedRegistrations.count} registration records`);

      // 7. Delete the registration form (references userId)
      await prisma.registrationForm.delete({
        where: { id },
      });
      console.log('Deleted registration form');

      // 8. Finally, delete the user account
      await prisma.user.delete({
        where: { id: registration.userId }
      });
      console.log('Deleted user account');

      console.log(`Registration and user account deleted for ${userName} (${userCustomId})`);

      res.json({
        success: true,
        message: 'Registration, user account, and all related data deleted successfully. Deletion notification email sent.',
        data: {
          deletedUser: {
            name: userName,
            email: userEmail,
            userId: userCustomId
          },
          deletedRecords: {
            payments: deletedPayments.count,
            activityLogs: deletedActivityLogs.count,
            marks: deletedMarks.count,
            attendanceRecords: deletedAttendanceRecords.count,
            checkIns: deletedCheckIns.count,
            registrations: deletedRegistrations.count
          }
        }
      });
    } catch (error) {
      console.error('Delete registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete registration',
        error: error.message,
      });
    }
  }

  async getRegistrationStats(req, res) {
    try {
      const stats = await prisma.registrationForm.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      });

      const totalRegistrations = await prisma.registrationForm.count();
      const confirmedRegistrations = await prisma.registrationForm.count({
        where: { status: 'CONFIRMED' },
      });
      const allocatedRegistrations = await prisma.registrationForm.count({
        where: {
          allocatedCommittee: { not: null },
          allocatedPortfolio: { not: null },
        },
      });

      res.json({
        success: true,
        stats: {
          total: totalRegistrations,
          confirmed: confirmedRegistrations,
          allocated: allocatedRegistrations,
          byStatus: stats,
        },
      });
    } catch (error) {
      console.error('Get registration stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get registration stats',
        error: error.message,
      });
    }
  }
}

export default new RegistrationController();