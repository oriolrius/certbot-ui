import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validate, schemas } from '../middleware/validation';

describe('Validation Middleware', () => {
  describe('certificateRequest schema', () => {
    it('should validate valid certificate request', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'standalone',
          agree_tos: true,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid email', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'invalid-email',
          plugin: 'standalone',
          agree_tos: true,
        },
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty domains', () => {
      const req = {
        body: {
          domains: [],
          email: 'test@example.com',
          plugin: 'standalone',
          agree_tos: true,
        },
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid plugin', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'invalid',
          agree_tos: true,
        },
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept staging as true', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'standalone',
          agree_tos: true,
          staging: true,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should accept staging as false', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'standalone',
          agree_tos: true,
          staging: false,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should accept DNS plugin with staging', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'dns',
          dns_provider: 'manual',
          agree_tos: true,
          staging: true,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid DNS provider', () => {
      const req = {
        body: {
          domains: ['example.com'],
          email: 'test@example.com',
          plugin: 'dns',
          dns_provider: 'invalid-provider',
          agree_tos: true,
        },
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      validate(schemas.certificateRequest)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('renewalOptions schema', () => {
    it('should validate valid renewal options', () => {
      const req = {
        body: {
          cert_name: 'example.com',
          dry_run: true,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.renewalOptions)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate empty renewal options', () => {
      const req = {
        body: {},
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.renewalOptions)(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('revocationOptions schema', () => {
    it('should validate valid revocation options', () => {
      const req = {
        body: {
          cert_name: 'example.com',
          reason: 'superseded',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      validate(schemas.revocationOptions)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing cert_name', () => {
      const req = {
        body: {},
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      validate(schemas.revocationOptions)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
