import { prisma } from '../config/database.js';

class GalleryController {
  async getGalleryItems(req, res) {
    try {
      const { category } = req.query;
      
      const whereClause = { isActive: true };
      if (category) {
        whereClause.category = category;
      }

      const galleryItems = await prisma.galleryItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: galleryItems,
      });
    } catch (error) {
      console.error('Get gallery items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gallery items',
        error: error.message,
      });
    }
  }

  async getGalleryItemById(req, res) {
    try {
      const { id } = req.params;

      const galleryItem = await prisma.galleryItem.findUnique({
        where: { id },
      });

      if (!galleryItem) {
        return res.status(404).json({
          success: false,
          message: 'Gallery item not found',
        });
      }

      res.json({
        success: true,
        data: galleryItem,
      });
    } catch (error) {
      console.error('Get gallery item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gallery item',
        error: error.message,
      });
    }
  }

  async createGalleryItem(req, res) {
    try {
      const { title, type, imageUrl, videoUrl, category } = req.body;

      // Validate required fields
      if (!title || !type || !imageUrl || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, type, imageUrl, and category are required',
        });
      }

      // Validate type
      if (!['image', 'video'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "image" or "video"',
        });
      }

      // For videos, videoUrl is required
      if (type === 'video' && !videoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Video URL is required for video type',
        });
      }

      const galleryItem = await prisma.galleryItem.create({
        data: {
          title,
          type,
          imageUrl,
          videoUrl: type === 'video' ? videoUrl : null,
          category,
        },
      });

      res.status(201).json({
        success: true,
        data: galleryItem,
        message: 'Gallery item created successfully',
      });
    } catch (error) {
      console.error('Create gallery item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create gallery item',
        error: error.message,
      });
    }
  }

  async updateGalleryItem(req, res) {
    try {
      const { id } = req.params;
      const { title, type, imageUrl, videoUrl, category } = req.body;

      // Validate type if provided
      if (type && !['image', 'video'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "image" or "video"',
        });
      }

      const galleryItem = await prisma.galleryItem.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(type && { type }),
          ...(imageUrl && { imageUrl }),
          ...(videoUrl && { videoUrl }),
          ...(category && { category }),
        },
      });

      res.json({
        success: true,
        data: galleryItem,
        message: 'Gallery item updated successfully',
      });
    } catch (error) {
      console.error('Update gallery item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update gallery item',
        error: error.message,
      });
    }
  }

  async deleteGalleryItem(req, res) {
    try {
      const { id } = req.params;

      await prisma.galleryItem.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Gallery item deleted successfully',
      });
    } catch (error) {
      console.error('Delete gallery item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete gallery item',
        error: error.message,
      });
    }
  }

  async getGalleryCategories(req, res) {
    try {
      const categories = await prisma.galleryItem.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      res.json({
        success: true,
        data: categories.map(c => c.category),
      });
    } catch (error) {
      console.error('Get gallery categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gallery categories',
        error: error.message,
      });
    }
  }
}

export default new GalleryController();

