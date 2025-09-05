import express from 'express';
import mailerController from '../controllers/mailerController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateMailerRequest, validateTestEmailRequest } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all mailer routes
router.use(authenticateToken);

// Send bulk email
router.post('/send', 
  validateMailerRequest,
  mailerController.sendBulkEmail
);

// Get email recipients by committee
router.get('/recipients', mailerController.getEmailRecipients);

// Get email statistics
router.get('/stats', mailerController.getEmailStats);

// Send test email
router.post('/test',
  validateTestEmailRequest,
  mailerController.sendTestEmail
);

export default router;
