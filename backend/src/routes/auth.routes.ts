import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { sensitiveRateLimiter } from '../middleware/security';

const router = Router();

router.post('/login', sensitiveRateLimiter, authController.login);
router.post('/register', sensitiveRateLimiter, authController.register);
router.post('/change-password', sensitiveRateLimiter, authController.changePassword);

export default router;
