import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.ts";
import {
  markAttendance,
  markGuestAttendance,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  getUserAttendance,
} from "../controllers/attendence.ts";

const router = Router();

router.post("/mark", authenticate, markAttendance);
router.post("/guest/mark", markGuestAttendance);
router.get("/today", authenticate, getTodayStatus);
router.get("/me", authenticate, getMyAttendance);
router.get("/all", authenticate, isAdmin, getAllAttendance);
router.get("/user/:userId", authenticate, isAdmin, getUserAttendance);

export default router;
