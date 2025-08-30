import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Activity logs endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Log activity - to be implemented' });
});

export default router;
