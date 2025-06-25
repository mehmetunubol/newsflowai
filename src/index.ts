import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import generateRouter from './routes/generate';
import voiceRouter from './routes/voice';

dotenv.config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newsflowai';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Routes
app.use('/generate', generateRouter);
app.use('/voice', voiceRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
