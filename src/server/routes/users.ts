import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/profile', (req: AuthRequest, res) => {
  res.json(req.user);
});

// Update user profile
router.put('/profile', (req: AuthRequest, res) => {
  res.json({ message: 'Profile updated' });
});

export default router;