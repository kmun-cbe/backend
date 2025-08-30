import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Marks endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Add marks - to be implemented' });
});

export default router;
