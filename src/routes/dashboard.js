import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get recent activity
router.get('/activity', dashboardController.getRecentActivity);

export default router;
