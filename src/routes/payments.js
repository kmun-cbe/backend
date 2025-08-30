import express from 'express';

const router = express.Router();

// Get all payments
router.get('/', (req, res) => {
  res.json({ message: 'Payments endpoint - to be implemented' });
});

// Create payment
router.post('/', (req, res) => {
  res.json({ message: 'Create payment - to be implemented' });
});

// Get payment by ID
router.get('/:id', (req, res) => {
  res.json({ message: 'Get payment by ID - to be implemented' });
});

export default router;
