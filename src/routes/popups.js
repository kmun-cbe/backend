import express from 'express';
import { body } from 'express-validator';
import popupController from '../controllers/popupController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Popup validation
const popupValidation = [
  body('heading').trim().isLength({ min: 3, max: 100 }).withMessage('Heading must be between 3 and 100 characters'),
  body('text').trim().isLength({ min: 10, max: 1000 }).withMessage('Text must be between 10 and 1000 characters'),
];

// Public route to get active popup
router.get('/active', popupController.getActivePopup);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('DEV_ADMIN'), popupController.getPopup);

router.put(
  '/',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  popupValidation,
  validateRequest,
  popupController.updatePopup
);

router.patch(
  '/toggle',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  popupController.togglePopup
);

export default router;
