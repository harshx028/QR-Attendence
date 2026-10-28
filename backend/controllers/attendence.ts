import { Response } from "express";
import prisma from "../services/prismaClient.ts";
import { AuthRequest } from "../types/express.ts";
import { saveToSheet, getAllAttendanceFromSheet, getMyAttendanceFromSheet, getTodayStatusFromSheet } from "../services/google.ts";

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
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    // Save to Google Sheet (separate function) - SQLite data store can be turned off separately
    try {
      await saveToSheet({
        userId,
        fullName: attendance.user?.fullName,
        email: attendance.user?.email,
        markedAt: attendance.markedAt,
      });
    } catch (sheetError: any) {
      console.error("[SHEET] Failed to save attendance to Google Sheet:", sheetError.message);
      // Continue even if sheet save fails - SQLite code remains intact
    }

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
    let email: string | undefined;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = user?.email;
    } catch (e) {
      // Ignore if SQLite turned off
    }

    try {
      const attendance = await getTodayStatusFromSheet(userId, email);
      return res.status(200).json({ success: true, marked: Boolean(attendance), attendance: attendance ?? null });
    } catch (sheetError: any) {
      console.error("Get today status from sheet error:", sheetError.message);
      // Fallback to SQLite if sheet fails
      const { start, end } = getDayRange();
      const attendance = await prisma.attendance.findFirst({
        where: { userId, markedAt: { gte: start, lt: end } },
      });
      return res.status(200).json({ success: true, marked: Boolean(attendance), attendance: attendance ?? null });
    }
  } catch (error: any) {
    console.error("Get today status error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance status", error: error.message });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let email: string | undefined;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      email = user?.email;
    } catch (e) {
      // Ignore if SQLite turned off
    }

    try {
      const attendances = await getMyAttendanceFromSheet(userId, email);
      return res.status(200).json({ success: true, attendances });
    } catch (sheetError: any) {
      console.error("Get my attendance from sheet error:", sheetError.message);
      // Fallback to SQLite if sheet fails
      const attendances = await prisma.attendance.findMany({
        where: { userId },
        orderBy: { markedAt: "desc" },
        take: 90,
      });
      return res.status(200).json({ success: true, attendances });
    }
  } catch (error: any) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance history", error: error.message });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    try {
      const attendances = await getAllAttendanceFromSheet(typeof date === "string" ? date : undefined);
      // Limit to 500 like original
      const limited = attendances.slice(0, 500);
      return res.status(200).json({ success: true, attendances: limited });
    } catch (sheetError: any) {
      console.error("Get all attendance from sheet error:", sheetError.message);
      // Fallback to SQLite if sheet fails
      let where: any = {};
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
      return res.status(200).json({ success: true, attendances });
    }
  } catch (error: any) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance records", error: error.message });
  }
};
