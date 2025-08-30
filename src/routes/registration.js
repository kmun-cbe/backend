import express from 'express';
import { body } from 'express-validator';
import registrationController from '../controllers/registrationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import fileUploadService from '../services/fileUploadService.js';

const router = express.Router();

// Registration validation
const registrationValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Valid gender is required'),
  body('isKumaraguru').isIn(['yes', 'no']).withMessage('Kumaraguru institution status is required'),
  body('totalMuns').notEmpty().withMessage('Total MUNs attended is required'),
  body('committeePreference1').notEmpty().withMessage('Committee preference 1 is required'),
  body('portfolioPreference1').notEmpty().withMessage('Portfolio preference 1 is required'),
  body('committeePreference2').notEmpty().withMessage('Committee preference 2 is required'),
  body('portfolioPreference2').notEmpty().withMessage('Portfolio preference 2 is required'),
  body('committeePreference3').notEmpty().withMessage('Committee preference 3 is required'),
  body('portfolioPreference3').notEmpty().withMessage('Portfolio preference 3 is required'),
];

// File upload middleware
const uploadMiddleware = fileUploadService.documentUpload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'munResume', maxCount: 1 },
]);

// Routes
router.post(
  '/',
  uploadMiddleware,
  registrationValidation,
  validateRequest,
  registrationController.createRegistration
);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('SOFTWARE_ADMIN', 'SUPER_ADMIN', 'REGISTRATION_ADMIN'),
  registrationController.getRegistrations
);

router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('SOFTWARE_ADMIN', 'SUPER_ADMIN', 'REGISTRATION_ADMIN'),
  registrationController.getRegistrationStats
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('SOFTWARE_ADMIN', 'SUPER_ADMIN', 'REGISTRATION_ADMIN'),
  registrationController.getRegistrationById
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('SOFTWARE_ADMIN', 'SUPER_ADMIN', 'ALLOCATION_ADMIN'),
  registrationController.updateRegistrationStatus
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('SOFTWARE_ADMIN', 'SUPER_ADMIN'),
  registrationController.deleteRegistration
);

export default router;