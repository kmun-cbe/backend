import express from 'express';
import { body } from 'express-validator';
import galleryController, { upload } from '../controllers/galleryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Gallery item validation
const galleryItemValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('type').trim().isIn(['image', 'video']).withMessage('Type must be either "image" or "video"'),
  body('imageUrl').optional().trim().isURL().withMessage('Valid image URL is required'),
  body('videoUrl').optional().trim().isURL().withMessage('Valid video URL is required'),
  body('category').trim().isLength({ min: 1, max: 50 }).withMessage('Category is required and must be less than 50 characters'),
];

// Public routes
router.get('/', galleryController.getGalleryItems);
router.get('/categories', galleryController.getGalleryCategories);
router.get('/:id', galleryController.getGalleryItemById);

// Protected routes (Admin only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  upload.single('imageFile'),
  galleryController.createGalleryItem
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  upload.single('imageFile'),
  galleryController.updateGalleryItem
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  galleryController.deleteGalleryItem
);

export default router;

