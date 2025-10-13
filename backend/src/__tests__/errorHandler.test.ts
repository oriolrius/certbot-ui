import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, notFoundHandler } from '../middleware/errorHandler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const req = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1' } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          statusCode: 400,
          code: 'TEST_ERROR',
        },
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const req = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1' } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error', () => {
      const req = { originalUrl: '/not-found' } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0] as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/not-found');
    });
  });
});
