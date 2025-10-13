import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            details: errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  certificateRequest: z.object({
    body: z.object({
      domains: z.array(z.string().min(1)).min(1),
      email: z.string().email(),
      plugin: z.enum(['standalone', 'webroot', 'nginx', 'apache', 'dns']),
      webroot_path: z.string().optional(),
      dns_provider: z.enum(['manual', 'cloudflare', 'route53', 'digitalocean', 'google']).optional(),
      dns_credentials: z.string().optional(),
      agree_tos: z.boolean(),
      staging: z.boolean().optional(),
    }),
  }),

  renewalOptions: z.object({
    body: z.object({
      cert_name: z.string().optional(),
      dry_run: z.boolean().optional(),
      force_renewal: z.boolean().optional(),
    }),
  }),

  revocationOptions: z.object({
    body: z.object({
      cert_name: z.string().min(1),
      reason: z.enum([
        'unspecified',
        'keycompromise',
        'affiliationchanged',
        'superseded',
        'cessationofoperation',
      ]).optional(),
      delete_after_revoke: z.boolean().optional(),
    }),
  }),

  certName: z.object({
    params: z.object({
      name: z.string().min(1),
    }),
  }),
};
