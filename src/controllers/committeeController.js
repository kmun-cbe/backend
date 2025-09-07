import { prisma } from '../config/database.js';

class CommitteeController {
  async getCommittees(req, res) {
    try {
      const committees = await prisma.committee.findMany({
        where: { isActive: true },
        include: {
          portfolios: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        data: committees,
      });
    } catch (error) {
      console.error('Get committees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get committees',
        error: error.message,
      });
    }
  }

  async getCommitteeById(req, res) {
    try {
      const { id } = req.params;

      const committee = await prisma.committee.findUnique({
        where: { id },
        include: {
          portfolios: true,
        },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      res.json({
        success: true,
        data: committee,
      });
    } catch (error) {
      console.error('Get committee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get committee',
        error: error.message,
      });
    }
  }

  async createCommittee(req, res) {
    try {
      const { name, description, type, institutionType, capacity } = req.body;
      
      // Handle uploaded logo file
      const logoPath = req.file ? `/uploads/committee-logos/${req.file.filename}` : null;

      // Check if committee with same name already exists
      const existingCommittee = await prisma.committee.findUnique({
        where: { name },
      });

      if (existingCommittee) {
        return res.status(400).json({
          success: false,
          message: 'Committee with this name already exists',
        });
      }

      const committee = await prisma.committee.create({
        data: {
          name,
          description,
          type: type || 'GENERAL', // Default type if not provided
          institutionType,
          capacity: parseInt(capacity) || 0,
          logo: logoPath,
        },
        include: {
          portfolios: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Committee created successfully',
        data: committee,
      });
    } catch (error) {
      console.error('Create committee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create committee',
        error: error.message,
      });
    }
  }

  async updateCommittee(req, res) {
    try {
      const { id } = req.params;
      const { name, description, type, institutionType, capacity } = req.body;
      
      // Handle uploaded logo file - only update if new file is uploaded
      const logoPath = req.file ? `/uploads/committee-logos/${req.file.filename}` : undefined;

      const updateData = {
        name,
        description,
        type: type || 'GENERAL', // Default type if not provided
        institutionType,
        capacity: parseInt(capacity) || 0,
      };

      // Only include logo in update if a new file was uploaded
      if (logoPath) {
        updateData.logo = logoPath;
      }

      const committee = await prisma.committee.update({
        where: { id },
        data: updateData,
        include: {
          portfolios: true,
        },
      });

      res.json({
        success: true,
        message: 'Committee updated successfully',
        data: committee,
      });
    } catch (error) {
      console.error('Update committee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update committee',
        error: error.message,
      });
    }
  }

  async deleteCommittee(req, res) {
    try {
      const { id } = req.params;

      await prisma.committee.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Committee deleted successfully',
      });
    } catch (error) {
      console.error('Delete committee error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete committee',
        error: error.message,
      });
    }
  }

  // Portfolio Management Methods
  async getPortfolios(req, res) {
    try {
      const { committeeId } = req.params;

      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
        include: {
          portfolios: true,
        },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      res.json({
        success: true,
        data: committee.portfolios,
      });
    } catch (error) {
      console.error('Get portfolios error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolios',
        error: error.message,
      });
    }
  }

  async addPortfolio(req, res) {
    try {
      const { committeeId } = req.params;
      const { name } = req.body;

      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      const portfolio = await prisma.portfolio.create({
        data: {
          name,
          committeeId,
        },
      });

      // Update committee capacity (count of portfolios)
      const portfolioCount = await prisma.portfolio.count({
        where: { committeeId },
      });

      await prisma.committee.update({
        where: { id: committeeId },
        data: { capacity: portfolioCount },
      });

      res.json({
        success: true,
        message: 'Portfolio added successfully',
        data: portfolio,
      });
    } catch (error) {
      console.error('Add portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add portfolio',
        error: error.message,
      });
    }
  }

  async updatePortfolio(req, res) {
    try {
      const { committeeId, portfolioId } = req.params;
      const { name } = req.body;

      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          committeeId: committeeId,
        },
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
        });
      }

      const updatedPortfolio = await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { name },
      });

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: updatedPortfolio,
      });
    } catch (error) {
      console.error('Update portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update portfolio',
        error: error.message,
      });
    }
  }

  async deletePortfolio(req, res) {
    try {
      const { committeeId, portfolioId } = req.params;

      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          committeeId: committeeId,
        },
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
        });
      }

      // Hard delete - actually remove the portfolio from database
      await prisma.portfolio.delete({
        where: { id: portfolioId },
      });

      // Update committee capacity (count of remaining portfolios)
      const portfolioCount = await prisma.portfolio.count({
        where: { committeeId },
      });

      await prisma.committee.update({
        where: { id: committeeId },
        data: { capacity: portfolioCount },
      });

      res.json({
        success: true,
        message: 'Portfolio deleted successfully',
      });
    } catch (error) {
      console.error('Delete portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete portfolio',
        error: error.message,
      });
    }
  }

  // Committee Statistics
  async getCommitteeStats(req, res) {
    try {
      const committees = await prisma.committee.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

      const stats = committees.map(committee => ({
        id: committee.id,
        name: committee.name,
        capacity: committee.capacity,
        registered: committee.registered,
        totalRegistrations: committee._count.registrations,
        availableSpots: committee.capacity - committee.registered,
      }));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get committee stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get committee statistics',
        error: error.message,
      });
    }
  }

  // Get committees by institution type
  async getCommitteesByInstitutionType(req, res) {
    try {
      const { institutionType } = req.params;

      const committees = await prisma.committee.findMany({
        where: { 
          isActive: true,
          institutionType: institutionType 
        },
        orderBy: { createdAt: 'asc' },
      });

      // Parse JSON fields
      const parsedCommittees = committees.map(committee => ({
        ...committee,
        topics: committee.topics ? JSON.parse(committee.topics) : [],
        chairs: committee.chairs ? JSON.parse(committee.chairs) : [],
        portfolios: committee.portfolios ? JSON.parse(committee.portfolios) : [],
      }));

      res.json({
        success: true,
        data: parsedCommittees,
      });
    } catch (error) {
      console.error('Get committees by institution type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get committees by institution type',
        error: error.message,
      });
    }
  }

  // Get first two committees for homepage
  async getFeaturedCommittees(req, res) {
    try {
      const committees = await prisma.committee.findMany({
        where: { isActive: true },
        include: {
          portfolios: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 2,
      });

      res.json({
        success: true,
        data: committees,
      });
    } catch (error) {
      console.error('Get featured committees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured committees',
        error: error.message,
      });
    }
  }
}

export default new CommitteeController();