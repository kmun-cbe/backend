import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Attendance endpoint - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Mark attendance - to be implemented' });
});

export default router;
