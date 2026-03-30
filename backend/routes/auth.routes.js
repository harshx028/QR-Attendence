import { Router } from "express";
import { signup, login, verify } from "../controllers/auth.js";
import { authenticate } from "../utils/jwt.js";

const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/", authenticate, verify);

export default router;
