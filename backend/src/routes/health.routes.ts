import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../config';

const router = Router();
const execAsync = promisify(exec);

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

router.get('/certbot', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await execAsync(`${config.certbot.path} --version`);

    res.json({
      success: true,
      data: {
        certbot: 'available',
        version: stdout.trim(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Certbot not available',
        statusCode: 503,
      },
    });
  }
});

export default router;
