import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PopupController {
  async getPopup(req, res) {
    try {
      let popup = await prisma.popup.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!popup) {
        // Create default popup if none exists
        popup = await prisma.popup.create({
          data: {
            heading: 'Welcome to K-MUN 2025!',
            text: 'Registration is now open for Kumaraguru Model United Nations 2025. Join us for an exciting experience of diplomacy and international cooperation.',
            isActive: false,
          },
        });
      }

      res.json({
        success: true,
        data: popup,
      });
    } catch (error) {
      console.error('Get popup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get popup',
        error: error.message,
      });
    }
  }

  async updatePopup(req, res) {
    try {
      const { heading, text, isActive } = req.body;

      // Validate required fields
      if (!heading || !text) {
        return res.status(400).json({
          success: false,
          message: 'Heading and text are required'
        });
      }

      let popup = await prisma.popup.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (popup) {
        // Update existing popup
        popup = await prisma.popup.update({
          where: { id: popup.id },
          data: {
            heading: heading,
            text: text,
            isActive: isActive !== undefined ? isActive : popup.isActive,
            updatedAt: new Date()
          },
        });
      } else {
        // Create new popup
        popup = await prisma.popup.create({
          data: {
            heading: heading,
            text: text,
            isActive: isActive !== undefined ? isActive : false,
          },
        });
      }

      res.json({
        success: true,
        message: 'Popup updated successfully',
        data: popup,
      });
    } catch (error) {
      console.error('Update popup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update popup',
        error: error.message,
      });
    }
  }

  async togglePopup(req, res) {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value',
        });
      }

      let popup = await prisma.popup.findFirst({
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!popup) {
        return res.status(404).json({
          success: false,
          message: 'No popup found. Please create a popup first.',
        });
      }

      popup = await prisma.popup.update({
        where: { id: popup.id },
        data: {
          isActive: isActive,
          updatedAt: new Date()
        },
      });

      res.json({
        success: true,
        message: `Popup ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: popup,
      });
    } catch (error) {
      console.error('Toggle popup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle popup',
        error: error.message,
      });
    }
  }

  async getActivePopup(req, res) {
    try {
      const popup = await prisma.popup.findFirst({
        where: { isActive: true },
      });

      if (!popup) {
        return res.json({
          success: true,
          data: null,
          message: 'No active popup',
        });
      }

      res.json({
        success: true,
        data: popup,
      });
    } catch (error) {
      console.error('Get active popup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active popup',
        error: error.message,
      });
    }
  }
}

export default new PopupController();
