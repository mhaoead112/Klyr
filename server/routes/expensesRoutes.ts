import express, { Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/expenses - Create a new expense
router.post('/', (async (req: Request, res: Response) => {
  const { goalId, amount, note } = req.body;
  const userId = (req as any).user.user_id;

  if (!goalId || !amount) {
    return res.status(400).json({ message: 'Goal ID and amount are required.' });
  }

  try {
    // Check if the goal exists before creating an expense
    const [goalRows] = await pool.execute('SELECT * FROM `goals` WHERE goal_id = ?', [goalId]);
    if (!Array.isArray(goalRows) || goalRows.length === 0) {
      return res.status(404).json({ message: 'Goal not found. Cannot create expense.' });
    }

    const expenseId = uuidv4();
    await pool.execute(
      'INSERT INTO `expenses` (expense_id, goal_id, paid_by_user_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [expenseId, goalId, userId, amount, note || null]
    );

    // Fetch the newly created expense to return it
    const [rows] = await pool.execute('SELECT * FROM `expenses` WHERE expense_id = ?', [expenseId]);
    const expense = Array.isArray(rows) ? rows[0] : {};

    res.status(201).json(expense);
  } catch (error) {
    console.error('Failed to create expense:', error);
    if ((error as any).code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ message: 'Goal not found. Cannot create expense.' });
    }
    res.status(500).json({ message: 'Failed to create expense.' });
  }
}) as express.RequestHandler);

export default router;
