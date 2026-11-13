import prisma from "../services/prismaClient";
import { Response } from "express";
import { AuthRequest } from "../types/express.ts";

export const getUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { fullName: "asc" },
    });
    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const userId = req.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};