import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import generateRouter from './routes/generate';

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Routes
app.use('/generate', generateRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
