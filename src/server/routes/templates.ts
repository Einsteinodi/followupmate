import express from 'express';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all templates for user
router.get('/', (req: AuthRequest, res) => {
  res.json([]);
});

// Create new template
router.post('/', (req: AuthRequest, res) => {
  res.json({ message: 'Template created' });
});

export default router;