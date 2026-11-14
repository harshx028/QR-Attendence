import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.ts";
import { getKioskQr } from "../controllers/kiosk.ts";

const router = Router();

// Kiosk display accounts (and admins) can fetch the live QR token.
router.get("/qr", authenticate, requireRole("QR_KIOSK", "ADMIN"), getKioskQr);

export default router;
