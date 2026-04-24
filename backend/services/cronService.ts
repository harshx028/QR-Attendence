import cron from "node-cron";
import crypto from "crypto";
import prisma from "./prismaClient";

export const initCronJobs = () => {
  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      const newToken = crypto.randomBytes(16).toString("hex");
      
      await prisma.attendanceToken.upsert({
        where: { name: "attendance token" },
        update: { value: newToken },
        create: { name: "attendance token", value: newToken },
      });

      console.log(`[CRON] Attendance token refreshed: ${newToken}`);
    } catch (error) {
      console.error("[CRON] Error refreshing attendance token:", error);
    }
  });

  console.log("[CRON] Attendance token rotation job scheduled (1 min interval)");
};
