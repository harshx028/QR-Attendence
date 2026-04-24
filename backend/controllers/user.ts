import prisma from "../services/prismaClient";
import { Response } from "express";
export const getMe = async (req: any, res: Response) => {
    try {
        const userId = req.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
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