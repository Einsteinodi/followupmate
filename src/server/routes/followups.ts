import express from 'express';
import Joi from 'joi';
import { db } from '../database/init';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Define follow-up interface
interface FollowUp {
  id: number;
  user_id: number;
  client_name: string;
  client_email: string;
  subject: string;
  message: string;
  follow_up_date: string | null;
  follow_up_time: string | null;
  priority: string;
  status: string;
  created_at: string;
}

// Validation schema
const followUpSchema = Joi.object({
  client_name: Joi.string().min(2).max(100).required(),
  client_email: Joi.string().email().required(),
  subject: Joi.string().min(5).max(200).required(),
  message: Joi.string().max(1000),
  follow_up_date: Joi.date().iso(),
  follow_up_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

// Get all follow-ups for user
router.get('/', (req: AuthRequest, res) => {
  const userId = req.user!.id;

  db.all(
    'SELECT * FROM follow_ups WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows as FollowUp[]);
    }
  );
});

// Create new follow-up
router.post('/', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { error, value } = followUpSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const {
    client_name,
    client_email,
    subject,
    message,
    follow_up_date,
    follow_up_time
  } = value;

  db.run(
    `INSERT INTO follow_ups 
     (user_id, client_name, client_email, subject, message, follow_up_date, follow_up_time,priority, status, created_at)
     VALUES (?, ?, ?, ?,?, ?, ?, ?, ?, ?)`,
    [
      userId,
      client_name,
      client_email,
      subject,
      message || '',
      follow_up_date || null,
      follow_up_time || null,
      value.priority || 'medium',
      'pending',
      new Date().toISOString()
    ],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Return the created follow-up
      db.get(
        'SELECT * FROM follow_ups WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json(row as FollowUp);
        }
      );
    }
  );
});

// Update follow-up status
router.put('/:id', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const followUpId = req.params.id;
  const { status } = req.body;

  if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE follow_ups SET status = ? WHERE id = ? AND user_id = ?',
    [status, followUpId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Follow-up not found' });
      }

      res.json({ message: 'Follow-up updated successfully' });
    }
  );
});

// Delete follow-up
router.delete('/:id', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const followUpId = req.params.id;

  db.run(
    'DELETE FROM follow_ups WHERE id = ? AND user_id = ?',
    [followUpId, userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Follow-up not found' });
      }

      res.json({ message: 'Follow-up deleted successfully' });
    }
  );
});

export default router;