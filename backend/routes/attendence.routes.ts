import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.ts";
import {
  markAttendance,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  getMonthlySummary,
  getAdminSummary,
} from "../controllers/attendence.ts";

const router = Router();

router.post("/mark", authenticate, markAttendance);
router.get("/today", authenticate, getTodayStatus);
router.get("/me", authenticate, getMyAttendance);
router.get("/summary", authenticate, getMonthlySummary);
router.get("/all", authenticate, isAdmin, getAllAttendance);
router.get("/summary/admin", authenticate, isAdmin, getAdminSummary);

export default router;
