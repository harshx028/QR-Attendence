import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.ts";
import {
  markAttendance,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
} from "../controllers/attendence.ts";

const router = Router();

router.post("/mark", authenticate, markAttendance);
router.get("/today", authenticate, getTodayStatus);
router.get("/me", authenticate, getMyAttendance);
router.get("/all", authenticate, isAdmin, getAllAttendance);

export default router;
