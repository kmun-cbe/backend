import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PricingController {
  async getCurrentPricing(req, res) {
    try {
      let pricing = await prisma.pricing.findFirst();

      if (!pricing) {
        // Create default pricing if none exists
        pricing = await prisma.pricing.create({
          data: {
            internalDelegate: 2500,
            externalDelegate: 3500,
          },
        });
      }

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      console.error('Get pricing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pricing',
        error: error.message,
      });
    }
  }

  async updatePricing(req, res) {
    try {
      const {
        internalDelegate,
        externalDelegate
      } = req.body;

      let pricing = await prisma.pricing.findFirst();

      if (pricing) {
        // Update existing pricing
        pricing = await prisma.pricing.update({
          where: { id: pricing.id },
          data: {
            internalDelegate: parseInt(internalDelegate) || 2500,
            externalDelegate: parseInt(externalDelegate) || 3500,
          },
        });
      } else {
        // Create new pricing
        pricing = await prisma.pricing.create({
          data: {
            internalDelegate: parseInt(internalDelegate) || 2500,
            externalDelegate: parseInt(externalDelegate) || 3500,
          },
        });
      }

      res.json({
        success: true,
        message: 'Pricing updated successfully',
        data: pricing,
      });
    } catch (error) {
      console.error('Update pricing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pricing',
        error: error.message,
      });
    }
  }
}

export default new PricingController();