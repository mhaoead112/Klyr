import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/insights/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [storageRows] = await pool.execute(
      'SELECT SUM(size) as total_storage FROM cloud_files WHERE user_id = ?',
      [userId]
    );
    const [transactionsRows] = await pool.execute(
      'SELECT COUNT(*) as total_transactions FROM transactions WHERE user_id = ?',
      [userId]
    );
    const [activityRows] = await pool.execute(
      'SELECT MAX(created_at) as last_activity FROM transactions WHERE user_id = ?',
      [userId]
    );
    const total_storage = Array.isArray(storageRows) && storageRows.length > 0 ? (storageRows as any)[0].total_storage : 0;
    const total_transactions = Array.isArray(transactionsRows) && transactionsRows.length > 0 ? (transactionsRows as any)[0].total_transactions : 0;
    const last_activity = Array.isArray(activityRows) && activityRows.length > 0 ? (activityRows as any)[0].last_activity : null;
    res.status(200).json({ total_storage, total_transactions, last_activity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch insights.' });
  }
});

export default router;
