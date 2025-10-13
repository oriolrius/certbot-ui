import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Simple in-memory user store for demo
// In production, use a proper database
const users = new Map<string, { id: string; username: string; password: string }>();

// Create a default admin user (only for development)
const defaultPassword = bcrypt.hashSync('admin123', 10);
users.set('admin', {
  id: '1',
  username: 'admin',
  password: defaultPassword,
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', 400, 'INVALID_CREDENTIALS');
      }

      const user = users.get(username);

      if (!user) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
      });

      logger.info(`User ${username} logged in successfully`);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Username and password are required', 400, 'INVALID_INPUT');
      }

      if (users.has(username)) {
        throw new AppError('Username already exists', 409, 'USER_EXISTS');
      }

      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400, 'WEAK_PASSWORD');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = (users.size + 1).toString();

      users.set(username, {
        id,
        username,
        password: hashedPassword,
      });

      const token = generateToken({ id, username });

      logger.info(`New user registered: ${username}`);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id,
            username,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, oldPassword, newPassword } = req.body;

      if (!username || !oldPassword || !newPassword) {
        throw new AppError('All fields are required', 400, 'INVALID_INPUT');
      }

      const user = users.get(username);

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const isValid = await bcrypt.compare(oldPassword, user.password);

      if (!isValid) {
        throw new AppError('Invalid old password', 401, 'INVALID_PASSWORD');
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400, 'WEAK_PASSWORD');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      users.set(username, user);

      logger.info(`User ${username} changed password`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
