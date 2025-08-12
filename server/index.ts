import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bankingRoutes from './routes/bankingRoutes.js';
import cloudRoutes from './routes/cloudRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import billRoutes from './routes/billRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import contributionsRoutes from './routes/contributionsRoutes.js';
import expensesRoutes from './routes/expensesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { checkDbConnection } from './checkDbConnection.js';
import { protect } from './middleware/authMiddleware.js';
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banking', protect, bankingRoutes);
app.use('/api/cloud', protect, cloudRoutes);
app.use('/api/insights', protect, insightsRoutes);
app.use('/api/groups', protect, groupRoutes);
app.use('/api/bills', protect, billRoutes);
app.use('/api/goals', protect, goalsRoutes);
app.use('/api/contributions', protect, contributionsRoutes);
app.use('/api/expenses', protect, expensesRoutes);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build
app.use(express.static(path.join(__dirname, "dist"))); // dist from vite

// Fallback to index.html for SPA routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get('/api', (_req, res) => {
  res.send('Hello from the Klyr API!');
});

async function startServer() {
  await checkDbConnection();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
