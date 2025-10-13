import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export interface Certificate {
  name: string;
  domains: string[];
  expiry: Date;
  status: 'valid' | 'expired' | 'expiring_soon';
  serial_number?: string;
  path?: string;
}

export interface CertbotCommand {
  command: string;
  args: string[];
  options?: Record<string, string>;
}

export interface CertbotResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CertificateRequest {
  domains: string[];
  email: string;
  plugin: 'standalone' | 'webroot' | 'nginx' | 'apache' | 'dns';
  webroot_path?: string;
  dns_provider?: 'manual' | 'cloudflare' | 'route53' | 'digitalocean' | 'google';
  dns_credentials?: string;
  agree_tos: boolean;
  staging?: boolean;
}

export interface RenewalOptions {
  cert_name?: string;
  dry_run?: boolean;
  force_renewal?: boolean;
}

export interface RevocationOptions {
  cert_name: string;
  reason?: 'unspecified' | 'keycompromise' | 'affiliationchanged' | 'superseded' | 'cessationofoperation';
  delete_after_revoke?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface JobResponse {
  jobId: string;
  status: string;
  message: string;
}
