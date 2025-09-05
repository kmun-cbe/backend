import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validatePaymentOrderRequest, 
  validatePaymentVerificationRequest, 
  validatePaymentRefundRequest 
} from '../middleware/validation.js';

const router = express.Router();

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
router.get('/', paymentController.getAllPayments);

// Get payment statistics
router.get('/stats', paymentController.getPaymentStats);

// Get transaction logs
router.get('/logs', paymentController.getTransactionLogs);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

// Refund payment
router.post('/:id/refund',
  validatePaymentRefundRequest,
  paymentController.refundPayment
);

export default router;
