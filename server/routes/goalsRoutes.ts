import express, { Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/goals - Create a new goal
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { groupId, title, targetAmount, deadline } = req.body;

  if (!groupId || !title || !targetAmount || !deadline) {
    res.status(400).json({ message: 'Group ID, title, target amount, and deadline are required.' });
    return;
  }

  try {
    const goalId = uuidv4();
    await pool.execute(
      'INSERT INTO `goals` (goal_id, group_id, title, target_amount, current_amount, deadline, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
      [goalId, groupId, title, targetAmount, 0, deadline, (req as any).user.user_id]
    );

    // Fetch the newly created goal to return it
    const [rows] = await pool.execute('SELECT * FROM `goals` WHERE goal_id = ?', [goalId]);
    const goal = Array.isArray(rows) ? rows[0] : {};

    res.status(201).json(goal);
  } catch (error) {
    console.error('Failed to create goal:', error);
    res.status(500).json({ message: 'Failed to create goal.' });
  }
});

export default router;
