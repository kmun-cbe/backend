import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Resources endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Upload resource - to be implemented' });
});

export default router;
