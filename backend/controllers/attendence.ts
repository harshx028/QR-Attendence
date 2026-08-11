import { Response } from "express";
import prisma from "../services/prismaClient.ts";
import { AuthRequest } from "../types/express.ts";
import { buildMonthlySummary, countWorkingDays } from "../services/attendanceSummary.ts";

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

export const getAdminSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const requestedMonth = month !== undefined ? Number(month) : now.getMonth();
    const monthIndex = Number.isInteger(requestedMonth) && requestedMonth >= 0 && requestedMonth <= 11 ? requestedMonth : now.getMonth();

    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
    const monthStart = new Date(year, monthIndex, 1);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    const records = await prisma.attendance.findMany({
      where: {
        markedAt: { gte: start, lt: end },
      },
    });

    const summary = buildMonthlySummary(users, records, monthStart, now);

    res.status(200).json({
      success: true,
      month: summary.month,
      year: summary.year,
      daysInMonth: summary.daysInMonth,
      workingDaysElapsed: summary.workingDaysElapsed,
      totalPresent: summary.totalPresent,
      totalAbsent: summary.totalAbsent,
      totalMembers: summary.totalMembers,
      summary: summary.summary,
    });
  } catch (error: any) {
    console.error("Get admin summary error:", error);
    res.status(500).json({ success: false, message: "Error fetching summary", error: error.message });
  }
};

export const getMonthlySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const attendances = await prisma.attendance.findMany({
      where: { userId, markedAt: { gte: start, lt: end } },
      orderBy: { markedAt: "asc" },
    });

    const presentDates = new Set(attendances.map((a) => new Date(a.markedAt).toDateString()));
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const workingDaysElapsed = countWorkingDays(start, now);
    const presentCount = presentDates.size;
    const absentCount = Math.max(workingDaysElapsed - presentCount, 0);
    const performancePct = workingDaysElapsed > 0 ? Math.round((presentCount / workingDaysElapsed) * 100) : 0;

    res.status(200).json({
      success: true,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      daysInMonth,
      workingDaysElapsed,
      presentCount,
      absentCount,
      performancePct,
      attendances,
    });
  } catch (error: any) {
    console.error("Get monthly summary error:", error);
    res.status(500).json({ success: false, message: "Error fetching monthly summary", error: error.message });
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
