import express from 'express';
import ContactController from '../controllers/contactController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public route for submitting contact forms
router.post('/', ContactController.submitContact);

// Protected routes for admin access
router.get('/', authenticateToken, authorizeRoles('DEV_ADMIN', 'DELEGATE_AFFAIRS'), ContactController.getAllContacts);
router.get('/stats', authenticateToken, authorizeRoles('DEV_ADMIN', 'DELEGATE_AFFAIRS'), ContactController.getContactStats);
router.get('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'DELEGATE_AFFAIRS'), ContactController.getContactById);
router.put('/:id', authenticateToken, authorizeRoles('DEV_ADMIN', 'DELEGATE_AFFAIRS'), ContactController.updateContact);
router.delete('/:id', authenticateToken, authorizeRoles('DEV_ADMIN'), ContactController.deleteContact);

export default router;
