import express from 'express';
import multer from 'multer';
// Import multer types for TypeScript
import type { Request } from 'express';
import type { RowDataPacket } from 'mysql2';
import pool from '../db.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/cloud/upload
router.post('/upload', upload.single('file'), async (req, res): Promise<void> => {
  const userId = req.body.userId;
  // Type assertion for file property from multer
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!userId || !file) {
    res.status(400).json({ message: 'User ID and file are required.' });
    return;
  }
  try {
    await pool.execute(
      'INSERT INTO cloud_files (user_id, filename, originalname, size, mimetype, upload_date) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, file.filename, file.originalname, file.size, file.mimetype]
    );
    res.status(200).json({ message: 'File uploaded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload file.' });
  }
});

// GET /api/cloud/list/:userId
router.get('/list/:userId', async (req, res): Promise<void> => {
  const { userId } = req.params;
  try {
    const [files] = await pool.execute(
      'SELECT id, originalname, size, mimetype, upload_date FROM cloud_files WHERE user_id = ? ORDER BY upload_date DESC',
      [userId]
    );
    // files is expected to be an array
    res.status(200).json(Array.isArray(files) ? files : []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch files.' });
  }
});

// DELETE /api/cloud/delete/:fileId
router.delete('/delete/:fileId', async (req, res): Promise<void> => {
  const { fileId } = req.params;
  try {
    const [rows] = await pool.execute('SELECT filename FROM cloud_files WHERE id = ?', [fileId]);
    // rows is expected to be an array
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }
    const rowArr = rows as RowDataPacket[];
    const filename = rowArr[0].filename;
    await pool.execute('DELETE FROM cloud_files WHERE id = ?', [fileId]);
    fs.unlinkSync(path.join('uploads', filename));
    res.status(200).json({ message: 'File deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete file.' });
  }
});

// GET /api/cloud/download/:fileId
router.get('/download/:fileId', async (req, res): Promise<void> => {
  const { fileId } = req.params;
  try {
    const [rows] = await pool.execute('SELECT filename, originalname FROM cloud_files WHERE id = ?', [fileId]);
    // rows is expected to be an array
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }
    const rowArr = rows as RowDataPacket[];
    const { filename, originalname } = rowArr[0];
    res.download(path.join('uploads', filename), originalname);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download file.' });
  }
});

export default router;
