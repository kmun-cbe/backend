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

      // Generate custom user ID
      const customUserId = await userIdService.generateUserId();
      console.log('Generated custom user ID:', customUserId);

      // Create user account first
      const userPassword = `Iam${firstName}1!@#`;
      const hashedPassword = await bcrypt.hash(userPassword, 12);

      const user = await prisma.user.create({
        data: {
          userId: customUserId,
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          role: 'PARTICIPANT',
        },
      });

      // Create registration form
      const registration = await prisma.registrationForm.create({
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
        registrationId: registration.id,
        paymentAmount: 150, // Base registration fee
        institution: institution || 'N/A',
        committeePreference1,
        committeePreference2,
        committeePreference3,
      }, 'outlook');

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
          tempPassword: userPassword,
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

      const registration = await prisma.registrationForm.findUnique({
        where: { id },
      });
      
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
      }

      // Delete associated files
      if (registration.idDocument) {
        await fileUploadService.deleteFile(registration.idDocument);
      }
      if (registration.munResume) {
        await fileUploadService.deleteFile(registration.munResume);
      }

      await prisma.registrationForm.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Registration deleted successfully',
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