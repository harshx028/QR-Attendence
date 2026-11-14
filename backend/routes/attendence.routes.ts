import { Router } from "express";
import { authenticate, isAdmin, notKiosk } from "../middleware/auth.middleware.ts";
import {
  markAttendance,
  markGuestAttendance,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  createGuestEntry,
} from "../controllers/attendence.ts";

const router = Router();

router.post("/mark", authenticate, notKiosk, markAttendance);
router.post("/guest/mark", markGuestAttendance);
router.post("/guest/entry", createGuestEntry);
router.get("/today", authenticate, getTodayStatus);
router.get("/me", authenticate, getMyAttendance);
router.get("/all", authenticate, isAdmin, getAllAttendance);

export default router;
