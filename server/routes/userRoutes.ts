import express, { Request, Response } from 'express';
import pool from '../db.js';
import { protect } from '../middleware/authMiddleware.js';

// Define a custom request type that includes the user property from the 'protect' middleware
interface AuthenticatedRequest extends Request {
  user?: { user_id: string };
}

const router = express.Router();

// Update user profile. The 'protect' middleware handles authentication.
router.patch('/:userId', protect, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { name, email } = req.body;

  // Ensure the authenticated user can only update their own profile
  if (!req.user || req.user.user_id !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  try {
    // MySQL does not support RETURNING, so we do an UPDATE then a SELECT
    const updateQuery = 'UPDATE users SET name = ?, email = ? WHERE user_id = ?';
    await pool.query(updateQuery, [name, email, userId]);

    const selectQuery = 'SELECT user_id as _id, name, email, balance, created_at FROM users WHERE user_id = ?';
    const [rows] = await pool.query(selectQuery, [userId]);

    const updatedUser = (rows as any[])[0];

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
