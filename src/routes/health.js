import express from 'express';
import HealthController from '../controllers/healthController.js';

const router = express.Router();

// Health check endpoints
router.get('/database', HealthController.checkDatabase);
router.get('/payment', HealthController.checkPaymentGateway);
router.get('/email', HealthController.checkEmailService);
router.get('/system', HealthController.getSystemHealth);

export default router;
