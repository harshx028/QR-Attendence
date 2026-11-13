import { Request, Response } from "express";
import prisma from "../services/prismaClient.ts";
import { AuthRequest } from "../types/express.ts";
import { saveToSheet, saveGuestToSheet } from "../services/google.ts";

const getISTDate = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { token, lat, lng, remarks } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "QR token is required" });
    }

    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });

    if (!tokenRecord || tokenRecord.value !== token) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }

    const today = getISTDate();
    const now = new Date();

    const existing = await prisma.attendance.findFirst({
      where: { userId, date: today },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!existing) {
      // First scan — CHECK-IN
      const attendance = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          markedAt: now,
          checkInLat: lat ?? null,
          checkInLng: lng ?? null,
          remarks: remarks || null,
        },
        include: { user: { select: { fullName: true, email: true } } },
      });

      saveToSheet({
        userId,
        fullName: attendance.user?.fullName,
        email: attendance.user?.email,
        eventType: "CHECK-IN",
        eventTime: now,
        lat: lat ?? null,
        lng: lng ?? null,
        remarks: remarks || null,
      }).catch((e) => console.error("[SHEET] Failed to log check-in:", e.message));

      return res.status(201).json({
        success: true,
        eventType: "CHECK-IN",
        message: "Check-in recorded successfully",
        attendance,
      });
    }

    if (existing.checkOutAt) {
      return res.status(409).json({
        success: false,
        message: "Already checked in and checked out for today",
        attendance: existing,
      });
    }

    // Second scan — CHECK-OUT
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutAt: now,
        checkOutLat: lat ?? null,
        checkOutLng: lng ?? null,
      },
      include: { user: { select: { fullName: true, email: true } } },
    });

    saveToSheet({
      userId,
      fullName: updated.user?.fullName,
      email: updated.user?.email,
      eventType: "CHECK-OUT",
      eventTime: now,
      lat: lat ?? null,
      lng: lng ?? null,
    }).catch((e) => console.error("[SHEET] Failed to log check-out:", e.message));

    return res.status(200).json({
      success: true,
      eventType: "CHECK-OUT",
      message: "Check-out recorded successfully",
      attendance: updated,
    });
  } catch (error: any) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ success: false, message: "Error marking attendance", error: error.message });
  }
};

export const getTodayStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const today = getISTDate();

    const attendance = await prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    return res.status(200).json({
      success: true,
      marked: Boolean(attendance),
      checkedIn: Boolean(attendance),
      checkedOut: Boolean(attendance?.checkOutAt),
      attendance: attendance ?? null,
    });
  } catch (error: any) {
    console.error("Get today status error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance status", error: error.message });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const month = typeof req.query.month === "string" ? req.query.month : undefined;

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "month must be in YYYY-MM format" });
    }

    const [attendances, user] = await Promise.all([
      prisma.attendance.findMany({
        // `date` is stored as YYYY-MM-DD (IST), so a prefix match selects the month.
        where: month ? { userId, date: { startsWith: `${month}-` } } : { userId },
        orderBy: { markedAt: "desc" },
        take: month ? 31 : 90,
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    ]);

    return res.status(200).json({
      success: true,
      attendances,
      today: getISTDate(),
      joinedOn: user
        ? user.createdAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        : null,
    });
  } catch (error: any) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance history", error: error.message });
  }
};

export const markGuestAttendance = async (req: Request, res: Response) => {
  try {
    const { token, fullName, phone, email, address, purpose, lat, lng } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "QR token is required" });
    }
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: "Name and phone are required" });
    }

    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });

    if (!tokenRecord || tokenRecord.value !== token) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code" });
    }

    const today = getISTDate();
    const now = new Date();

    const existing = await prisma.guestAttendance.findFirst({
      where: { phone, date: today },
    });

    if (!existing) {
      const attendance = await prisma.guestAttendance.create({
        data: {
          fullName,
          phone,
          email: email || null,
          address: address || null,
          purpose: purpose || null,
          date: today,
          markedAt: now,
          checkInLat: lat ?? null,
          checkInLng: lng ?? null,
        },
      });

      saveGuestToSheet({
        fullName,
        phone,
        email: email || null,
        address: address || null,
        purpose: purpose || null,
        eventType: "CHECK-IN",
        eventTime: now,
        lat: lat ?? null,
        lng: lng ?? null,
      }).catch((e) => console.error("[SHEET] Failed to log guest check-in:", e.message));

      return res.status(201).json({
        success: true,
        eventType: "CHECK-IN",
        message: "Check-in recorded successfully",
        attendance,
      });
    }

    if (existing.checkOutAt) {
      return res.status(409).json({
        success: false,
        message: "Already checked in and checked out for today",
        attendance: existing,
      });
    }

    const updated = await prisma.guestAttendance.update({
      where: { id: existing.id },
      data: {
        checkOutAt: now,
        checkOutLat: lat ?? null,
        checkOutLng: lng ?? null,
      },
    });

    saveGuestToSheet({
      fullName: existing.fullName,
      phone: existing.phone,
      email: existing.email,
      address: existing.address,
      purpose: existing.purpose,
      eventType: "CHECK-OUT",
      eventTime: now,
      lat: lat ?? null,
      lng: lng ?? null,
    }).catch((e) => console.error("[SHEET] Failed to log guest check-out:", e.message));

    return res.status(200).json({
      success: true,
      eventType: "CHECK-OUT",
      message: "Check-out recorded successfully",
      attendance: updated,
    });
  } catch (error: any) {
    console.error("Mark guest attendance error:", error);
    res.status(500).json({ success: false, message: "Error marking attendance", error: error.message });
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: date ? { date: String(date) } : {},
      orderBy: { markedAt: "desc" },
      take: 500,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    return res.status(200).json({ success: true, attendances });
  } catch (error: any) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ success: false, message: "Error fetching attendance records", error: error.message });
  }
};
