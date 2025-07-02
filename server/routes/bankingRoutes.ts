import express from 'express';
import pool from '../db.js';
import { protect } from '../middleware/authMiddleware.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/banking/topup
// Tops up a user's main balance.
router.post('/topup', protect, (async (req: AuthRequest, res: express.Response) => {
  const { amount, method } = req.body;
  const userId = req.user?.user_id;

  if (!amount || !method) {
    return res.status(400).json({ message: 'Amount and method are required.' });
  }
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Increase user's balance
    await connection.execute(
      'UPDATE users SET balance = balance + ? WHERE user_id = ?',
      [amount, userId]
    );

    // Log the transaction
    await connection.execute(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
      [userId, 'topup', amount, `Top-up via ${method}`]
    );

    await connection.commit();

    // Fetch the updated user to return the new balance
    const [rows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedUser = (rows as any[])[0];

    res.status(200).json({ message: 'Top-up successful!', user: updatedUser });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the top-up process.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);


// GET /api/banking/transactions/:userId
// Gets all transactions for a user.
router.get('/transactions/:userId', (async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching transactions.' });
  }
}) as express.RequestHandler);


// GET /api/banking/cards/:userId
// Gets all virtual cards for a user.
router.get('/cards/:userId', (async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const [cards] = await pool.execute(
      'SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching virtual cards.' });
  }
}) as express.RequestHandler);

// DELETE /api/banking/cards/:cardId
// Deletes a virtual card and refunds its balance.
router.delete('/cards/:cardId', (async (req: express.Request, res: express.Response) => {
  const { cardId } = req.params;
  const { userId } = req.body; // userId should be sent in the body for verification

  if (!cardId || !userId) {
    return res.status(400).json({ message: 'Card ID and User ID are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get the card and verify ownership
    const [cardRows] = await connection.execute('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId]);
    const card = (cardRows as any[])[0];

    if (!card) {
      await connection.rollback();
      return res.status(404).json({ message: 'Card not found or user does not have permission to delete it.' });
    }

    // Refund the balance to the user's main account
    await connection.execute('UPDATE users SET balance = balance + ? WHERE user_id = ?', [card.balance, userId]);

    // Delete the card
    await connection.execute('DELETE FROM cards WHERE id = ?', [cardId]);

    // Get the updated user object to return
    const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedUser = (userRows as any[])[0];
    delete updatedUser.password; // Do not send password hash

    await connection.commit();
    res.status(200).json({ message: 'Card deleted successfully.', user: updatedUser });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting the card.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);

// POST /api/banking/cards/:cardId/topup
// Tops up a virtual card from the user's main balance.
router.post('/cards/:cardId/topup', (async (req: express.Request, res: express.Response) => {
  const { cardId } = req.params;
  const { userId, amount } = req.body;

  const numericAmount = parseFloat(amount);
  if (!userId || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ message: 'User ID and a positive amount are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user and card to verify ownership and funds
    const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const user = (userRows as any[])[0];

    const [cardRows] = await connection.execute('SELECT * FROM cards WHERE id = ? AND user_id = ?', [cardId, userId]);
    const card = (cardRows as any[])[0];

    if (!user || !card) {
      await connection.rollback();
      return res.status(404).json({ message: 'User or card not found.' });
    }

    if (user.balance < numericAmount) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient funds in main account.' });
    }

    // Perform the transaction
    await connection.execute('UPDATE users SET balance = balance - ? WHERE user_id = ?', [numericAmount, userId]);
    await connection.execute('UPDATE cards SET balance = balance + ? WHERE id = ?', [numericAmount, cardId]);

    // Get updated user and card to return
    const [updatedUserRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedUser = (updatedUserRows as any[])[0];
    delete updatedUser.password;

    const [updatedCardRows] = await connection.execute('SELECT * FROM cards WHERE id = ?', [cardId]);
    const updatedCard = (updatedCardRows as any[])[0];

    await connection.commit();
    res.status(200).json({ message: 'Top-up successful.', user: updatedUser, card: updatedCard });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the top-up.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);

// POST /api/banking/send
// Sends money from one user to another.
router.post('/send', (async (req: express.Request, res: express.Response) => {
  const { fromUserId, toEmail, amount, description } = req.body;

  if (!fromUserId || !toEmail || !amount) {
    return res.status(400).json({ message: 'Sender ID, recipient email, and amount are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get sender
    const [fromUserRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [fromUserId]);
    const fromUser = (fromUserRows as any[])[0];

    if (!fromUser || fromUser.balance < amount) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient funds or sender not found.' });
    }

    // Get recipient
    const [toUserRows] = await connection.execute('SELECT * FROM users WHERE email = ?', [toEmail]);
    const toUser = (toUserRows as any[])[0];

    if (!toUser) {
      await connection.rollback();
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    // Perform transfers
    await connection.execute('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, fromUserId]);
    await connection.execute('UPDATE users SET balance = balance + ? WHERE user_id = ?', [amount, toUser.user_id]);

    // Create transactions for both users
    const finalDescription = description || `Sent to ${toUser.email}`;
    await connection.execute(
      `INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, 'send', ?, ?, 'completed')`,
      [fromUserId, amount, finalDescription]
    );
    await connection.execute(
      `INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, 'receive', ?, ?, 'completed')`,
      [toUser.user_id, amount, `Received from ${fromUser.name}`]
    );

    await connection.commit();

    // Get the updated sender user object to return
    const [updatedFromUserRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [fromUserId]);
    const updatedFromUser = (updatedFromUserRows as any[])[0];

    res.status(200).json({ message: 'Money sent successfully!', user: updatedFromUser });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the send money process.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);

// POST /api/banking/withdraw
// Withdraws money from a user's account.
router.post('/withdraw', protect, (async (req: AuthRequest, res: express.Response) => {
  const { amount, method } = req.body;
  const userId = req.user?.user_id;

  if (!amount || !method) {
    return res.status(400).json({ message: 'Amount and method are required.' });
  }
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user
    const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const user = (userRows as any[])[0];

    if (!user || user.balance < amount) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient funds or user not found.' });
    }

    // Perform withdrawal
    await connection.execute('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, userId]);

    // Create transaction
    await connection.execute(
      `INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, 'withdraw', ?, ?, 'completed')`,
      [userId, amount, `Withdraw to ${method}`]
    );

    await connection.commit();

    // Get the updated user object to return
    const [updatedUserRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedUser = (updatedUserRows as any[])[0];

    res.status(200).json({ message: 'Withdrawal successful!', user: updatedUser });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the withdrawal process.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);

// POST /api/banking/cards
// Creates a new virtual card for the authenticated user
router.post('/cards', protect, (async (req: AuthRequest, res: express.Response) => {
  const { card_holder_name, balance } = req.body;
  const cardHolder = card_holder_name; // For backward compatibility
  const userId = req.user?.user_id;

  if (!cardHolder || balance === undefined) {
    return res.status(400).json({ message: 'Card holder and balance are required.' });
  }
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get user
    const [userRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const user = (userRows as any[])[0];

    if (!user || user.balance < balance) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient funds or user not found.' });
    }

    // Deduct balance from main account
    await connection.execute('UPDATE users SET balance = balance - ? WHERE user_id = ?', [balance, userId]);

    // Create card
    const cardNumber = `4532 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryDate = `${Math.floor(1 + Math.random() * 12).toString().padStart(2, '0')}/${new Date().getFullYear() + 5 - 2000}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const [result] = await connection.execute(
      `INSERT INTO cards (user_id, card_number, card_holder_name, expiry_date, cvv, balance) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, cardNumber, cardHolder, expiryDate, cvv, balance]
    );

    const cardId = (result as any).insertId;

    // Get the new card
    const [cardRows] = await connection.execute('SELECT * FROM cards WHERE id = ?', [cardId]);
    const newCard = (cardRows as any[])[0];

    // Get the updated user object to return
    const [updatedUserRows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedUser = (updatedUserRows as any[])[0];

    await connection.commit();

    res.status(201).json({ message: 'Card created successfully!', card: newCard, user: updatedUser });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during card creation.' });
  } finally {
    connection.release();
  }
}) as express.RequestHandler);

export default router;
