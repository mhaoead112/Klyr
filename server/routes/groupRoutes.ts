import express, { Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/groups - Create a new group
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, description, owner_id } = req.body;
  if (!name || !owner_id) {
    res.status(400).json({ message: 'Name and owner_id are required.' });
    return;
  }
  try {
    const groupId = uuidv4();
    await pool.execute(
      'INSERT INTO `groups` (group_id, name, description, owner_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [groupId, name, description || '', owner_id]
    );

    // Add the owner as a member
    const memberId = uuidv4();
    await pool.execute(
      'INSERT INTO `group_members` (id, group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, NOW())',
      [memberId, groupId, owner_id, 'admin']
    );

    // Fetch the full group details to return
    const [rows] = await pool.execute('SELECT * FROM `groups` WHERE group_id = ?', [groupId]);
    const group = Array.isArray(rows) ? rows[0] : {};

    // A new group won't have goals, but we need the arrays to be there for the frontend
    const fullGroupDetails = {
      ...group,
      members: [{ user_id: owner_id, role: 'admin' }], // Add the owner to the members list
      goals: [],
    };

    res.status(201).json({ message: 'Group created successfully!', group: fullGroupDetails });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group.' });
  }
});

// GET /api/groups/:userId - Get all groups for a user
// GET /api/groups/user/:userId - Get all groups for a user
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const [groups] = (await pool.execute(
      'SELECT g.*, COUNT(DISTINCT gm.user_id) as member_count FROM `groups` g LEFT JOIN `group_members` gm ON g.group_id = gm.group_id WHERE gm.user_id = ? GROUP BY g.group_id',
      [userId]
    )) as any[];

    if (groups.length > 0) {
      const groupIds = groups.map((g: any) => g.group_id);
      const placeholders = groupIds.map(() => '?').join(',');

      const goalsQuery = `SELECT * FROM goals WHERE group_id IN (${placeholders})`;
      const [goals] = (await pool.execute(goalsQuery, groupIds)) as any[];

      groups.forEach((group: any) => {
        group.goals = goals.filter((g: any) => g.group_id === group.group_id);
      });
    }

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch groups.' });
  }
});

// GET /api/groups/:groupId - Get full details for a single group
router.get('/:groupId', async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  try {
    const [groupRows] = (await pool.execute('SELECT * FROM `groups` WHERE group_id = ?', [groupId])) as any[];
    if (groupRows.length === 0) {
      res.status(404).json({ message: 'Group not found' });
    } else {
      const group = groupRows[0];

      const [members] = (await pool.execute(
        'SELECT u.user_id, u.name, u.email, gm.role FROM users u JOIN group_members gm ON u.user_id = gm.user_id WHERE gm.group_id = ?',
        [groupId]
      )) as any[];
      group.members = members;

      const goalsQuery = `
        SELECT 
          g.*, 
          (COALESCE((SELECT SUM(c.amount) FROM contributions c WHERE c.goal_id = g.goal_id), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.goal_id = g.goal_id), 0)) AS current_amount
        FROM goals g 
        WHERE g.group_id = ?`;
      const [goals] = (await pool.execute(goalsQuery, [groupId])) as any[];
      group.goals = goals;

      const goalIds = goals.map((g: any) => g.goal_id);

      if (goalIds.length > 0) {
        const placeholders = goalIds.map(() => '?').join(',');
        const contributionsQuery = `SELECT c.*, u.name, u.email FROM contributions c JOIN users u ON c.user_id = u.user_id WHERE c.goal_id IN (${placeholders})`;
        const [allContributions] = (await pool.execute(contributionsQuery, goalIds)) as any[];
        group.contributions = allContributions;

        const expensesQuery = `SELECT e.*, u.name, u.email FROM expenses e JOIN users u ON e.paid_by_user_id = u.user_id WHERE e.goal_id IN (${placeholders})`;
        const [allExpenses] = (await pool.execute(expensesQuery, goalIds)) as any[];
        group.expenses = allExpenses;
      } else {
        group.contributions = [];
        group.expenses = [];
      }

      res.json(group);
    }
  } catch (error) {
    console.error('Failed to fetch group details:', error);
    res.status(500).json({ message: 'Failed to fetch group details.' });
  }
});

// POST /api/groups/invite - Invite a user to a group
router.post('/invite', async (req: Request, res: Response): Promise<void> => {
  const { groupId, email } = req.body;

  if (!groupId || !email) {
    res.status(400).json({ message: 'Group ID and email are required.' });
    return;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Find user by email
    const [userRows]: any = await connection.execute('SELECT user_id FROM `users` WHERE email = ?', [email]);
    if (userRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ message: 'User with that email not found.' });
      return;
    }
    const userId = userRows[0].user_id;

    // Check if user is already a member
    const [memberRows]: any = await connection.execute(
      'SELECT id FROM `group_members` WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (memberRows.length > 0) {
      await connection.rollback();
      res.status(409).json({ message: 'User is already a member of this group.' });
      return;
    }

    // Add user to group
    const memberId = uuidv4();
    await connection.execute(
      'INSERT INTO `group_members` (id, group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, NOW())',
      [memberId, groupId, userId, 'member']
    );

    await connection.commit();
    res.status(200).json({ message: 'User invited successfully.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to invite user:', error);
    res.status(500).json({ message: 'Failed to invite user.' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;