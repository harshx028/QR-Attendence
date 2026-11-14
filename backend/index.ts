import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';
import authRoutes from './routes/auth.routes.ts';
import userRoutes from './routes/user.routes.ts';
import attendanceRoutes from './routes/attendence.routes.ts';
import { initCronJobs } from './services/cronService.ts';
import kioskRoutes from './routes/kiosk.routes.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

initCronJobs();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/kiosk', kioskRoutes);

// The old server-rendered pages now live in the web panel. If WEB_APP_URL is
// set (e.g. https://panel.example.org), old links and printed QR posters redirect there.
const WEB_APP_URL = process.env.WEB_APP_URL?.replace(/\/+$/, '');
if (WEB_APP_URL) {
  app.get('/attendance/entry', (_req: Request, res: Response) => res.redirect(301, `${WEB_APP_URL}/guest`));
  app.get(/^\/attendance\/qr(\/.*)?$/, (_req: Request, res: Response) => res.redirect(301, `${WEB_APP_URL}/kiosk`));
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
