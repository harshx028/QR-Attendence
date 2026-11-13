import { Router } from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware";
import { getMe, getUsers } from "../controllers/user";

const router = Router();

router.get("/me", authenticate, getMe);
router.get("/", authenticate, isAdmin, getUsers);

export default router;