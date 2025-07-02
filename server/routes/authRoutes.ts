import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import pool from '../db.js';
import { protect } from '../middleware/authMiddleware.js';

// Define a custom request type that includes the user property from the 'protect' middleware
interface AuthenticatedRequest extends express.Request {
  user?: { user_id: string };
}

const router = express.Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_default_secret', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
router.post('/register', (async (req: express.Request, res: express.Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = (rows as any[])[0];

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    
    await pool.execute(
      'INSERT INTO users (user_id, name, email, password, balance) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, 0]
    );

    const [userRows] = await pool.execute('SELECT user_id, name, email, balance FROM users WHERE user_id = ?', [userId]);
    const newUser = (userRows as any[])[0];

    if (newUser) {
      res.status(201).json({
        message: 'User registered successfully!',
        token: generateToken(newUser.user_id),
        user: newUser,
      });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the registration process.' });
  }
}) as express.RequestHandler);

// POST /api/auth/login
router.post('/login', (async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT user_id, name, email, balance, password FROM users WHERE email = ?', [email]);
    const user = (rows as any[])[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({
        message: 'Login successful!',
        token: generateToken(user.user_id),
        user: userWithoutPassword,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the login process.' });
  }
}) as express.RequestHandler);

// POST /api/auth/change-password
router.post('/change-password', protect, (async (req: express.Request, res: express.Response) => {
  const { currentPassword, newPassword } = req.body;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authorized, user ID missing' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT password FROM users WHERE user_id = ?', [userId]);
    const user = (rows as any[])[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const passwordIsValid = await bcrypt.compare(currentPassword, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.execute('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, userId]);

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'An error occurred while changing the password.' });
  }
}) as express.RequestHandler);

export default router;
