import { Router } from 'express';
import certificatesRoutes from './certificates.routes';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/health', healthRoutes);

export default router;
