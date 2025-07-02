import express, { Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/contributions - Create a new contribution
router.post('/', (async (req: Request, res: Response) => {
  const { goalId, amount, note } = req.body;
  const userId = (req as any).user.user_id;

  if (!goalId || !amount) {
    return res.status(400).json({ message: 'Goal ID and amount are required.' });
  }

  try {
    // Check if the goal exists before creating a contribution
    const [goalRows] = await pool.execute('SELECT * FROM `goals` WHERE goal_id = ?', [goalId]);
    if (!Array.isArray(goalRows) || goalRows.length === 0) {
      return res.status(404).json({ message: 'Goal not found. Cannot create contribution.' });
    }

    const contributionId = uuidv4();
    await pool.execute(
      'INSERT INTO `contributions` (contribution_id, goal_id, user_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [contributionId, goalId, userId, amount, note || null]
    );

    // Fetch the newly created contribution to return it
    const [rows] = await pool.execute('SELECT * FROM `contributions` WHERE contribution_id = ?', [contributionId]);
    const contribution = Array.isArray(rows) ? rows[0] : {};

    res.status(201).json(contribution);
  } catch (error) {
    console.error('Failed to create contribution:', error);
    if ((error as any).code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ message: 'Goal not found. Cannot create contribution.' });
    }
    res.status(500).json({ message: 'Failed to create contribution.' });
  }
}) as express.RequestHandler);

export default router;
