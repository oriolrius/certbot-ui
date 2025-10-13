import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { generateToken, verifyToken, authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken({ id: '1', username: 'test' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: '1', username: 'test' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('authMiddleware', () => {
    it('should authenticate valid token', () => {
      const payload = { id: '1', username: 'test' };
      const token = generateToken(payload);

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as AuthRequest;

      const res = {} as Response;
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(payload.id);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      const req = {
        headers: {},
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
