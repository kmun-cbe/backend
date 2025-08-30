import express from 'express';
import { body } from 'express-validator';
import pricingController from '../controllers/pricingController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Pricing validation
const pricingValidation = [
  body('internalDelegate')
    .isFloat({ min: 0 })
    .withMessage('Internal delegate price must be a positive number'),
  body('externalDelegate')
    .isFloat({ min: 0 })
    .withMessage('External delegate price must be a positive number'),
  body('accommodationCharge')
    .isFloat({ min: 0 })
    .withMessage('Accommodation charge must be a positive number'),
];

// Routes
router.get('/', pricingController.getCurrentPricing);
router.put(
  '/',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  pricingValidation,
  validateRequest,
  pricingController.updatePricing
);

export default router;