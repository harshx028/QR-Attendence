import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';
import authRoutes from './routes/auth.routes.ts';
import userRoutes from './routes/user.routes.ts';
import { initCronJobs } from './services/cronService.ts';
import { renderQRPage } from './controllers/qrController.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Cron Jobs
initCronJobs();

app.use(cors());
app.use(express.json());


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes)

// Attendance QR Page (HTML)
app.get('/attendance/qr', renderQRPage);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
