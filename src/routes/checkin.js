import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Check-in endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Check-in user - to be implemented' });
});

export default router;
