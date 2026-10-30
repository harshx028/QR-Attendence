import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import authRoutes from './routes/auth.routes.ts';
import userRoutes from './routes/user.routes.ts';
import attendanceRoutes from './routes/attendence.routes.ts';
import { initCronJobs } from './services/cronService.ts';
import {
  showLoginPage,
  processLogin,
  logoutKiosk,
  authenticateKiosk,
  renderQRPage,
} from './controllers/qrController.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

initCronJobs();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// QR kiosk web pages
app.get('/attendance/qr/login', showLoginPage);
app.post('/attendance/qr/login', processLogin);
app.get('/attendance/qr/logout', logoutKiosk);
app.get('/attendance/qr', authenticateKiosk, renderQRPage);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
