import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fileUploadService from '../services/fileUploadService.js';
import emailService from '../services/emailService.js';
import paymentService from '../services/paymentService.js';

const prisma = new PrismaClient();

class RegistrationController {
  async createRegistration(req, res) {
    try {
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
        portfolioPreference1_1,
        portfolioPreference1_2,
        portfolioPreference1_3,
        committeePreference2,
        portfolioPreference2_1,
        portfolioPreference2_2,
        portfolioPreference2_3,
        committeePreference3,
        portfolioPreference3_1,
        portfolioPreference3_2,
        portfolioPreference3_3,
      } = req.body;

      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Validate required files
      if (!req.files || !req.files.idDocument) {
        return res.status(400).json({
          success: false,
          message: 'ID document is required',
        });
      }

      // Create user account first
      const userPassword = `Iam${firstName}1!@#`;
      const hashedPassword = await bcrypt.hash(userPassword, 12);

      const user = await prisma.user.create({
        data: {
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
          portfolioPreference1: portfolioPreference1_1,
          committeePreference2,
          portfolioPreference2: portfolioPreference2_1,
          committeePreference3,
          portfolioPreference3: portfolioPreference3_1,
          idDocument: req.files.idDocument[0].path,
          munResume: req.files.munResume ? req.files.munResume[0].path : null,
        },
      });

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
          email: user.email,
          tempPassword: userPassword,
        },
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
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        search,
        sortBy = 'submittedAt',
        sortOrder = 'DESC',
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { institution: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const [registrations, total] = await Promise.all([
        prisma.registrationForm.findMany({
          where,
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
          skip: offset,
          take: parseInt(limit),
          orderBy: {
            [sortBy]: sortOrder,
          },
        }),
        prisma.registrationForm.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          registrations,
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
      res.status(500).json({
        success: false,
        message: 'Failed to get registrations',
        error: error.message,
      });
    }
  }

  async getRegistrationById(req, res) {
    try {
      const { id } = req.params;

      const registration = await prisma.registration.findUnique({
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

      const registration = await prisma.registration.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found',
        });
      }

      const updatedRegistration = await prisma.registration.update({
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

      const registration = await prisma.registration.findUnique({
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

      await prisma.registration.delete({
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
      const stats = await prisma.registration.groupBy({
        by: ['status', 'paymentStatus'],
        _count: {
          id: true,
        },
      });

      const totalRegistrations = await prisma.registration.count();
      const confirmedRegistrations = await prisma.registration.count({
        where: { status: 'CONFIRMED' },
      });
      const paidRegistrations = await prisma.registration.count({
        where: { paymentStatus: 'PAID' },
      });
      const allocatedRegistrations = await prisma.registration.count({
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
          paid: paidRegistrations,
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