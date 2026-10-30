import { Router } from 'express';
import { signup, login, logout, resetPassword } from '../controllers/auth.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/reset-password', authenticate, resetPassword);

export default router;
