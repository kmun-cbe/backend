import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Accommodation endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create accommodation - to be implemented' });
});

export default router;
