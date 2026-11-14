import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express.ts';
import prisma from '../services/prismaClient.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_highly_secure_secret_key';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying admin access' });
  }
};

/** Allow only users whose role is in `roles`. Use after `authenticate`. */
export const requireRole =
  (...roles: string[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "You don't have access to this resource" });
      }
      next();
    } catch {
      return res.status(500).json({ success: false, message: "Error verifying access" });
    }
  };

/** Block kiosk display accounts (e.g. from marking attendance). Use after `authenticate`. */
export const notKiosk = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
    if (user?.role === "QR_KIOSK") {
      return res.status(403).json({ success: false, message: "Kiosk accounts can't mark attendance" });
    }
    next();
  } catch {
    return res.status(500).json({ success: false, message: "Error verifying access" });
  }
};
