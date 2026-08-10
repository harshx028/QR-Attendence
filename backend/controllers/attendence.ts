import { Response } from "express";
import prisma from "../services/prismaClient.ts";
import { AuthRequest } from "../types/express.ts";

const getDayRange = (date: Date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "QR token is required" });
    }

    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });

    if (!tokenRecord || tokenRecord.value !== token) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }

    const { start, end } = getDayRange();

    const existing = await prisma.attendance.findFirst({
      where: { userId, markedAt: { gte: start, lt: end } },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today",
        attendance: existing,
      });
    }

    const attendance = await prisma.attendance.create({
      data: { userId },
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error: any) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ success: false, message: "Error marking attendance", error: error.message });
  }
};

export const getTodayStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { start, end } = getDayRange();

    const attendance = await prisma.attendance.findFirst({
      where: { userId, markedAt: { gte: start, lt: end } },
    });

    res.status(200).json({ success: true, marked: Boolean(attendance), attendance: attendance ?? null });
  } catch (error: any) {
    console.error("Get today status error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance status", error: error.message });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const attendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { markedAt: "desc" },
      take: 90,
    });

    res.status(200).json({ success: true, attendances });
  } catch (error: any) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance history", error: error.message });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    let where = {};
    if (typeof date === "string") {
      const { start, end } = getDayRange(new Date(date));
      where = { markedAt: { gte: start, lt: end } };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { markedAt: "desc" },
      take: 500,
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    res.status(200).json({ success: true, attendances });
  } catch (error: any) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance records", error: error.message });
  }
};
