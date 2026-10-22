import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { sensitiveRateLimiter } from '../middleware/security';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', sensitiveRateLimiter, authController.login);
router.post('/register', sensitiveRateLimiter, authMiddleware, authController.register);
router.post('/change-password', sensitiveRateLimiter, authMiddleware, authController.changePassword);

export default router;
