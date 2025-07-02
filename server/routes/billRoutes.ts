import express, { Request, Response, RequestHandler } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/bills - Create a new bill
router.post('/', (async (req: Request, res: Response) => {
  const { title, amount, groupId, participantIds } = req.body;
  const createdBy = (req as any).user.user_id;

  if (!title || !amount || !groupId || !participantIds || !participantIds.length) {
    return res.status(400).json({ message: 'Title, amount, group ID, and at least one participant are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const billId = uuidv4();
    await connection.execute(
      'INSERT INTO `bills` (bill_id, group_id, title, amount, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [billId, groupId, title, amount, createdBy]
    );

    const participantPromises = participantIds.map((participantId: string) => {
      return connection.execute(
        'INSERT INTO `bill_participants` (bill_id, user_id, paid) VALUES (?, ?, ?)',
        [billId, participantId, false]
      );
    });

    await Promise.all(participantPromises);

    await connection.commit();

    const [rows] = await connection.execute('SELECT * FROM `bills` WHERE bill_id = ?', [billId]);
    const bill = Array.isArray(rows) ? rows[0] : {};

    res.status(201).json(bill);
  } catch (error) {
    await connection.rollback();
    console.error('Failed to create bill:', error);
    res.status(500).json({ message: 'Failed to create bill.' });
  } finally {
    connection.release();
  }
}) as RequestHandler);

// GET /api/bills/user/:userId - Get all bills for a user
router.get('/user/:userId', (async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT b.* FROM bills b
             JOIN bill_participants bp ON b.bill_id = bp.bill_id
             WHERE bp.user_id = ?`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch user bills:', error);
        res.status(500).json({ message: 'Failed to fetch user bills.' });
    }
}) as RequestHandler);

// POST /api/bills/pay - Mark a bill as paid
router.post('/pay', (async (req: Request, res: Response) => {
    const { billId } = req.body;
    const userId = (req as any).user.user_id;
    try {
        await pool.execute(
            'UPDATE bill_participants SET paid = true WHERE bill_id = ? AND user_id = ?',
            [billId, userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to pay bill:', error);
        res.status(500).json({ message: 'Failed to pay bill.' });
    }
}) as RequestHandler);


export default router;
