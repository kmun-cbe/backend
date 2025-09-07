import express from 'express';
import { body } from 'express-validator';
import committeeController from '../controllers/committeeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Committee validation
const committeeValidation = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Committee name is required'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description must not be empty'),
  body('type').optional().trim().isLength({ min: 1 }).withMessage('Committee type must not be empty if provided'),
  body('institutionType').trim().isIn(['school', 'college', 'both']).withMessage('Valid institution type is required'),
  body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be a non-negative integer'),
];

// Portfolio validation
const portfolioValidation = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Portfolio name is required'),
];

// Committee Routes
router.get('/', committeeController.getCommittees);
router.get('/featured', committeeController.getFeaturedCommittees);
router.get('/institution/:institutionType', committeeController.getCommitteesByInstitutionType);
router.get('/:id', committeeController.getCommitteeById);
router.get('/stats', committeeController.getCommitteeStats);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  committeeValidation,
  validateRequest,
  committeeController.createCommittee
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  committeeValidation,
  validateRequest,
  committeeController.updateCommittee
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  committeeController.deleteCommittee
);

// Portfolio Management Routes
router.get('/:committeeId/portfolios', committeeController.getPortfolios);

router.post(
  '/:committeeId/portfolios',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  portfolioValidation,
  validateRequest,
  committeeController.addPortfolio
);

router.put(
  '/:committeeId/portfolios/:portfolioId',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  portfolioValidation,
  validateRequest,
  committeeController.updatePortfolio
);

router.delete(
  '/:committeeId/portfolios/:portfolioId',
  authenticateToken,
  authorizeRoles('DEV_ADMIN'),
  committeeController.deletePortfolio
);

export default router;