import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Events endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create event - to be implemented' });
});

export default router;
