import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getMe } from "../controllers/user";


const router = Router()

router.get('/me', authenticate, getMe);

export default router