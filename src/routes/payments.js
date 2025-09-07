import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { 
  validatePaymentOrderRequest, 
  validatePaymentVerificationRequest, 
  validatePaymentRefundRequest 
} from '../middleware/validation.js';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', paymentController.testPaymentService);

// Apply authentication to all payment routes
router.use(authenticateToken);

// Create payment order
router.post('/create-order', 
  validatePaymentOrderRequest,
  paymentController.createPaymentOrder
);

// Verify payment
router.post('/verify',
  validatePaymentVerificationRequest,
  paymentController.verifyPayment
);

// Get all payments (with pagination and filters)
router.get('/', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN', 'FRONT_DESK_ADMIN'), paymentController.getAllPayments);

// Get payment statistics
router.get('/stats', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), paymentController.getPaymentStats);

// Get transaction logs
router.get('/logs', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), paymentController.getTransactionLogs);

// Get payment by ID
router.get('/:id', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN', 'FRONT_DESK_ADMIN'), paymentController.getPaymentById);

// Refund payment
router.post('/:id/refund',
  validatePaymentRefundRequest,
  paymentController.refundPayment
);

export default router;
