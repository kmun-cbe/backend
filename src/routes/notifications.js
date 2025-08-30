import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Send notification - to be implemented' });
});

export default router;
