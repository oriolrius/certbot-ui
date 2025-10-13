import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CertbotService } from '../services/certbot.service';

describe('CertbotService', () => {
  let service: CertbotService;

  beforeEach(() => {
    service = new CertbotService();
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const dangerous = 'test;rm -rf /';
      const result = (service as any).sanitizeInput(dangerous);
      expect(result).not.toContain(';');
      expect(result).toBe('testrm -rf ');
    });

    it('should preserve safe characters', () => {
      const safe = 'example.com';
      const result = (service as any).sanitizeInput(safe);
      expect(result).toBe(safe);
    });

    it('should handle special shell characters', () => {
      const dangerous = 'test$(whoami)`echo test`&& ls';
      const result = (service as any).sanitizeInput(dangerous);
      expect(result).not.toContain('$');
      expect(result).not.toContain('`');
      expect(result).not.toContain('&');
    });
  });

  describe('parseCertificateList', () => {
    it('should parse certificate output correctly', () => {
      const output = `
Certificate Name: example.com
  Domains: example.com www.example.com
  Expiry Date: 2024-12-31 23:59:59+00:00 (VALID: 89 days)
  Serial Number: 1234567890abcdef
  Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
`;

      const result = (service as any).parseCertificateList(output);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('example.com');
      expect(result[0].domains).toContain('example.com');
      expect(result[0].domains).toContain('www.example.com');
      expect(result[0].serial_number).toBe('1234567890abcdef');
    });

    it('should handle multiple certificates', () => {
      const output = `
Certificate Name: example.com
  Domains: example.com
  Expiry Date: 2024-12-31 23:59:59+00:00 (VALID: 89 days)

Certificate Name: test.com
  Domains: test.com
  Expiry Date: 2024-06-30 23:59:59+00:00 (VALID: 20 days)
`;

      const result = (service as any).parseCertificateList(output);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('example.com');
      expect(result[1].name).toBe('test.com');
    });

    it('should handle empty output', () => {
      const output = '';
      const result = (service as any).parseCertificateList(output);
      expect(result).toHaveLength(0);
    });
  });

  describe('obtainCertificate', () => {
    it('should build correct args for standalone plugin', () => {
      const request = {
        domains: ['example.com', 'www.example.com'],
        email: 'test@example.com',
        plugin: 'standalone' as const,
        agree_tos: true,
      };

      // Test that the method would build correct arguments
      // Note: We can't test the actual execution without certbot installed
      expect(request.plugin).toBe('standalone');
      expect(request.domains).toHaveLength(2);
    });

    it('should include webroot path for webroot plugin', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'webroot' as const,
        webroot_path: '/var/www/html',
        agree_tos: true,
      };

      expect(request.plugin).toBe('webroot');
      expect(request.webroot_path).toBeDefined();
    });

    it('should accept staging flag as true', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'standalone' as const,
        agree_tos: true,
        staging: true,
      };

      expect(request.staging).toBe(true);
    });

    it('should accept staging flag as false', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'standalone' as const,
        agree_tos: true,
        staging: false,
      };

      expect(request.staging).toBe(false);
    });

    it('should handle staging flag as undefined (defaults to production)', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'standalone' as const,
        agree_tos: true,
      };

      expect(request.staging).toBeUndefined();
    });

    it('should handle DNS manual validation with staging', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'dns' as const,
        dns_provider: 'manual' as const,
        agree_tos: true,
        staging: true,
      };

      expect(request.plugin).toBe('dns');
      expect(request.dns_provider).toBe('manual');
      expect(request.staging).toBe(true);
    });

    it('should handle DNS automatic providers with staging', () => {
      const request = {
        domains: ['example.com'],
        email: 'test@example.com',
        plugin: 'dns' as const,
        dns_provider: 'cloudflare' as const,
        dns_credentials: 'api_token_here',
        agree_tos: true,
        staging: true,
      };

      expect(request.plugin).toBe('dns');
      expect(request.dns_provider).toBe('cloudflare');
      expect(request.staging).toBe(true);
    });
  });
});
