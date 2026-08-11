import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import authRoutes from "./routes/auth.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import attendanceRoutes from "./routes/attendence.routes.ts";
import { initCronJobs } from "./services/cronService.ts";
import { renderQRPage } from "./controllers/qrController.ts";
import prisma from "./services/prismaClient";
import { buildMonthlySummary } from "./services/attendanceSummary.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// EJS View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Initialize Cron Jobs
initCronJobs();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : false,
  })
);
app.use(express.json());

const adminPanelPassword = process.env.ADMIN_PANEL_PASSWORD;

const isAdminPanelAuthorized = (req: Request): boolean => {
  if (!adminPanelPassword) return false;
  const authHeader = req.headers.authorization || "";
  const b64 = authHeader.replace(/^Basic /i, "");
  if (!b64) return false;
  try {
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const password = decoded.split(":")[1];
    return password === adminPanelPassword;
  } catch {
    return false;
  }
};

const renderAdminPanel = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    const records = await prisma.attendance.findMany({
      where: { markedAt: { gte: monthStart, lt: monthEnd } },
    });

    const summary = buildMonthlySummary(users, records, monthStart, now);

    res.render("admin", {
      summary: summary.summary,
      totalMembers: summary.totalMembers,
      totalPresent: summary.totalPresent,
      totalAbsent: summary.totalAbsent,
      daysInMonth: summary.daysInMonth,
      elapsed: summary.workingDaysElapsed,
      monthName: monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    });
  } catch (error) {
    console.error("Error rendering admin page:", error);
    res.status(500).send("Internal Server Error");
  }
};
app.get("/admin", (req, res) => {
  if (!adminPanelPassword) {
    return res.status(404).send("Not Found");
  }
  if (!isAdminPanelAuthorized(req)) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
    return res.status(401).send("Unauthorized");
  }
  void renderAdminPanel(req, res);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/attendance", attendanceRoutes);

// Attendance QR Page (HTML)
app.get("/attendance/qr", renderQRPage);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
