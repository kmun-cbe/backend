import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CommitteeController {
  async getCommittees(req, res) {
    try {
      const committees = await prisma.committee.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      // Parse JSON fields
      const parsedCommittees = committees.map(committee => ({
        ...committee,
        topics: JSON.parse(committee.topics || '[]'),
        chairs: JSON.parse(committee.chairs || '[]'),
        portfolios: JSON.parse(committee.portfolios || '[]'),
      }));

      res.json({
        success: true,
        data: parsedCommittees,
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
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      // Parse JSON fields
      const parsedCommittee = {
        ...committee,
        topics: JSON.parse(committee.topics || '[]'),
        chairs: JSON.parse(committee.chairs || '[]'),
        portfolios: JSON.parse(committee.portfolios || '[]'),
      };

      res.json({
        success: true,
        data: parsedCommittee,
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
      const { name, description, capacity, topics = [], chairs = [], portfolios = [], image } = req.body;

      const committee = await prisma.committee.create({
        data: {
          name,
          description,
          capacity: parseInt(capacity) || 0,
          topics: JSON.stringify(topics),
          chairs: JSON.stringify(chairs),
          portfolios: JSON.stringify(portfolios),
          image,
        },
      });

      // Parse JSON fields for response
      const parsedCommittee = {
        ...committee,
        topics: JSON.parse(committee.topics || '[]'),
        chairs: JSON.parse(committee.chairs || '[]'),
        portfolios: JSON.parse(committee.portfolios || '[]'),
      };

      res.status(201).json({
        success: true,
        message: 'Committee created successfully',
        data: parsedCommittee,
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
      const { name, description, capacity, topics = [], chairs = [], portfolios = [], image } = req.body;

      const committee = await prisma.committee.update({
        where: { id },
        data: {
          name,
          description,
          capacity: parseInt(capacity) || 0,
          topics: JSON.stringify(topics),
          chairs: JSON.stringify(chairs),
          portfolios: JSON.stringify(portfolios),
          image,
        },
      });

      // Parse JSON fields for response
      const parsedCommittee = {
        ...committee,
        topics: JSON.parse(committee.topics || '[]'),
        chairs: JSON.parse(committee.chairs || '[]'),
        portfolios: JSON.parse(committee.portfolios || '[]'),
      };

      res.json({
        success: true,
        message: 'Committee updated successfully',
        data: parsedCommittee,
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
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      const portfolios = JSON.parse(committee.portfolios || '[]');

      res.json({
        success: true,
        data: portfolios,
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
      const { name, description, capacity } = req.body;

      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      const portfolios = JSON.parse(committee.portfolios || '[]');
      const newPortfolio = {
        id: Date.now().toString(),
        name,
        description,
        capacity: parseInt(capacity) || 0,
        registered: 0,
      };

      portfolios.push(newPortfolio);

      await prisma.committee.update({
        where: { id: committeeId },
        data: {
          portfolios: JSON.stringify(portfolios),
        },
      });

      res.json({
        success: true,
        message: 'Portfolio added successfully',
        data: newPortfolio,
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
      const { name, description, capacity } = req.body;

      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      const portfolios = JSON.parse(committee.portfolios || '[]');
      const portfolioIndex = portfolios.findIndex(p => p.id === portfolioId);

      if (portfolioIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found',
        });
      }

      portfolios[portfolioIndex] = {
        ...portfolios[portfolioIndex],
        name,
        description,
        capacity: parseInt(capacity) || 0,
      };

      await prisma.committee.update({
        where: { id: committeeId },
        data: {
          portfolios: JSON.stringify(portfolios),
        },
      });

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: portfolios[portfolioIndex],
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

      const committee = await prisma.committee.findUnique({
        where: { id: committeeId },
      });

      if (!committee) {
        return res.status(404).json({
          success: false,
          message: 'Committee not found',
        });
      }

      const portfolios = JSON.parse(committee.portfolios || '[]');
      const filteredPortfolios = portfolios.filter(p => p.id !== portfolioId);

      await prisma.committee.update({
        where: { id: committeeId },
        data: {
          portfolios: JSON.stringify(filteredPortfolios),
        },
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
}

export default new CommitteeController();