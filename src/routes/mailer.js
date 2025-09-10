import express from 'express';
import mailerController from '../controllers/mailerController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateMailerRequest, validateTestEmailRequest } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all mailer routes
router.use(authenticateToken);

// Send bulk email
router.post('/send', 
  authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN', 'DELEGATE_AFFAIRS'),
  validateMailerRequest,
  mailerController.sendBulkEmail
);

// Get email recipients by committee
router.get('/recipients', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN', 'DELEGATE_AFFAIRS'), mailerController.getEmailRecipients);

// Get email statistics
router.get('/stats', authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'), mailerController.getEmailStats);

// Send test email
router.post('/test',
  authorizeRoles('DEV_ADMIN', 'SOFTWARE_ADMIN'),
  validateTestEmailRequest,
  mailerController.sendTestEmail
);

// Send payment success email
router.post('/send-payment-success',
  mailerController.sendPaymentSuccessEmail
);

export default router;
