import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import users from '../services/user.service';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

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

      const isValid = await users.verifyPassword(username, password);

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

  // Creates an additional user. Requires an authenticated user (see auth.routes):
  // anyone with an account can manage certificates, so sign-up is not public.
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const { id } = await users.create(username, password);

      logger.info(`User ${req.user?.username} created user ${username}`);

      res.status(201).json({
        success: true,
        data: {
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

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // The user is taken from the verified JWT, never from the request body
      const username = req.user?.username;
      const { oldPassword, newPassword } = req.body;

      if (!username || !users.has(username)) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (!oldPassword || !newPassword) {
        throw new AppError('Current and new password are required', 400, 'INVALID_INPUT');
      }

      if (!(await users.verifyPassword(username, oldPassword))) {
        // 400 rather than 401: the session is valid, only the submitted password is wrong
        throw new AppError('Invalid current password', 400, 'INVALID_PASSWORD');
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400, 'WEAK_PASSWORD');
      }

      await users.setPassword(username, newPassword);

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
