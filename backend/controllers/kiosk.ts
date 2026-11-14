import { Response } from "express";
import prisma from "../services/prismaClient.ts";
import { AuthRequest } from "../types/express.ts";

/** How often the cron job in services/cronService.ts rotates the token. */
export const TOKEN_ROTATION_SECONDS = 60;

/**
 * Current attendance QR token for the kiosk display (web panel renders the QR).
 * `expiresAt` is when the next rotation is due; `serverTime` lets the client
 * correct for clock drift when showing the countdown.
 */
export const getKioskQr = async (_req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.attendanceToken.findUnique({ where: { name: "attendance token" } });
    if (!record) {
      return res.status(503).json({
        success: false,
        message: "QR code not generated yet. It will appear within a minute.",
      });
    }
    // The cron job rotates the token at the start of every minute, so the next
    // rotation is the next minute boundary on this server's clock. (Deliberately
    // not derived from the stored updatedAt, which can come back timezone-shifted.)
    const now = Date.now();
    const step = TOKEN_ROTATION_SECONDS * 1000;
    const nextRotation = Math.floor(now / step) * step + step;

    return res.status(200).json({
      success: true,
      token: record.value,
      updatedAt: record.updatedAt.toISOString(),
      expiresAt: new Date(nextRotation).toISOString(),
      rotationSeconds: TOKEN_ROTATION_SECONDS,
      serverTime: new Date(now).toISOString(),
    });
  } catch (error: any) {
    console.error("Get kiosk QR error:", error);
    res.status(500).json({ success: false, message: "Error fetching QR code" });
  }
};
