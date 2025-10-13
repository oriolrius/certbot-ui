import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CertificateDownloadService } from '../services/certificate-download.service';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CertificateDownloadService', () => {
  let service: CertificateDownloadService;
  const testCertName = 'test-certificate';
  const testPassword = 'testpassword123';

  beforeEach(() => {
    service = new CertificateDownloadService();
  });

  describe('getFilename', () => {
    it('should generate correct filename for PEM fullchain', () => {
      const filename = service.getFilename('example.com', 'pem', 'fullchain');
      expect(filename).toBe('example.com-fullchain.pem');
    });

    it('should generate correct filename for DER cert', () => {
      const filename = service.getFilename('example.com', 'der', 'cert');
      expect(filename).toBe('example.com-cert.der');
    });

    it('should generate correct filename for PKCS12 fullchain', () => {
      const filename = service.getFilename('example.com', 'pkcs12', 'fullchain');
      expect(filename).toBe('example.com-fullchain.pkcs12');
    });

    it('should sanitize certificate names with special characters', () => {
      const filename = service.getFilename('test@cert!name', 'pem', 'fullchain');
      expect(filename).toBe('test_cert_name-fullchain.pem');
    });

    it('should remove trailing underscores', () => {
      const filename = service.getFilename('example.com.', 'pem', 'cert');
      // The dot at the end should not create a trailing underscore
      expect(filename).not.toMatch(/_-cert\.pem$/);
      expect(filename).toBe('example.com.-cert.pem');
    });

    it('should never produce filenames ending with underscores', () => {
      const testCases = [
        'example.com!',
        'example.com!!',
        'example.com!!!',
        'domain.com@',
        'domain.com@@',
        'test@joor.net',
        'test@joor.net!',
        'test@joor.net!!',
        'test.joor.net_',
        'test.joor.net__',
        '*.example.com',
        'example.com_',
        'example.com__',
        'test@domain.com_',
        'test@domain.com__'
      ];

      testCases.forEach(certName => {
        const filename = service.getFilename(certName, 'pem', 'fullchain');
        expect(filename).not.toMatch(/_$/);
        expect(filename).not.toMatch(/_-fullchain\.pem$/);
        // Ensure filename doesn't end with underscore anywhere
        expect(filename.charAt(filename.length - 1)).not.toBe('_');
      });
    });

    it('should handle wildcard certificates', () => {
      const filename = service.getFilename('*.example.com', 'pem', 'fullchain');
      expect(filename).toBe('_.example.com-fullchain.pem');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for PEM', () => {
      expect(service.getMimeType('pem')).toBe('application/x-pem-file');
    });

    it('should return correct MIME type for DER', () => {
      expect(service.getMimeType('der')).toBe('application/pkix-cert');
    });

    it('should return correct MIME type for P7B', () => {
      expect(service.getMimeType('p7b')).toBe('application/x-pkcs7-certificates');
    });

    it('should return correct MIME type for PKCS12', () => {
      expect(service.getMimeType('pkcs12')).toBe('application/x-pkcs12');
    });

    it('should return correct MIME type for JKS', () => {
      expect(service.getMimeType('jks')).toBe('application/octet-stream');
    });

    it('should return correct MIME type for CRT', () => {
      expect(service.getMimeType('crt')).toBe('application/pkix-cert');
    });

    it('should return correct MIME type for CER', () => {
      expect(service.getMimeType('cer')).toBe('application/pkix-cert');
    });
  });

  describe('getCertificate - validation', () => {
    it('should require password for PKCS12 format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'pkcs12',
          component: 'fullchain',
          // No password provided
        })
      ).rejects.toThrow('Password is required for PKCS12 format');
    });

    it('should require password for JKS format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'jks',
          component: 'fullchain',
          // No password provided
        })
      ).rejects.toThrow('Password is required for JKS format');
    });

    it('should reject bundle with DER format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'der',
          component: 'bundle',
        })
      ).rejects.toThrow('DER format does not support bundle');
    });

    it('should reject privkey with P7B format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'p7b',
          component: 'privkey',
        })
      ).rejects.toThrow('P7B format does not support private key');
    });

    it('should reject bundle with P7B format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'p7b',
          component: 'bundle',
        })
      ).rejects.toThrow('P7B format does not support bundle');
    });

    it('should reject chain with PKCS12 format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'pkcs12',
          component: 'chain',
          password: testPassword,
        })
      ).rejects.toThrow('PKCS12 format requires certificate and private key');
    });

    it('should reject chain with JKS format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'jks',
          component: 'chain',
          password: testPassword,
        })
      ).rejects.toThrow('JKS format requires certificate and private key');
    });

    it('should reject privkey with JKS format', async () => {
      await expect(
        service.getCertificate({
          certName: testCertName,
          format: 'jks',
          component: 'privkey',
          password: testPassword,
        })
      ).rejects.toThrow('JKS format requires certificate and private key');
    });
  });

  describe('getRootCertificates', () => {
    it('should return ISRG Root X1 certificate', async () => {
      const roots = await service.getRootCertificates();

      expect(roots.isrgRootX1).toBeInstanceOf(Buffer);
      expect(roots.isrgRootX1.toString()).toContain('-----BEGIN CERTIFICATE-----');
      expect(roots.isrgRootX1.toString()).toContain('-----END CERTIFICATE-----');
    });

    it('should return ISRG Root X2 certificate', async () => {
      const roots = await service.getRootCertificates();

      expect(roots.isrgRootX2).toBeInstanceOf(Buffer);
      expect(roots.isrgRootX2.toString()).toContain('-----BEGIN CERTIFICATE-----');
      expect(roots.isrgRootX2.toString()).toContain('-----END CERTIFICATE-----');
    });

    it('should return different certificates for X1 and X2', async () => {
      const roots = await service.getRootCertificates();

      expect(roots.isrgRootX1.toString()).not.toBe(roots.isrgRootX2.toString());
    });
  });

  describe('Format compatibility matrix', () => {
    const formats: Array<'pem' | 'der' | 'p7b' | 'pkcs12' | 'jks' | 'crt' | 'cer'> = [
      'pem',
      'der',
      'p7b',
      'pkcs12',
      'jks',
      'crt',
      'cer',
    ];

    const components: Array<'cert' | 'fullchain' | 'chain' | 'privkey' | 'bundle'> = [
      'cert',
      'fullchain',
      'chain',
      'privkey',
      'bundle',
    ];

    // Valid combinations
    const validCombinations: Array<[string, string]> = [
      // PEM supports all
      ['pem', 'cert'],
      ['pem', 'fullchain'],
      ['pem', 'chain'],
      ['pem', 'privkey'],
      ['pem', 'bundle'],
      // DER supports all except bundle
      ['der', 'cert'],
      ['der', 'fullchain'],
      ['der', 'chain'],
      ['der', 'privkey'],
      // P7B supports cert, fullchain, chain (no privkey, no bundle)
      ['p7b', 'cert'],
      ['p7b', 'fullchain'],
      ['p7b', 'chain'],
      // PKCS12 supports cert, fullchain, bundle (needs privkey)
      ['pkcs12', 'cert'],
      ['pkcs12', 'fullchain'],
      ['pkcs12', 'bundle'],
      // JKS supports cert, fullchain, bundle (needs privkey)
      ['jks', 'cert'],
      ['jks', 'fullchain'],
      ['jks', 'bundle'],
      // CRT same as PEM
      ['crt', 'cert'],
      ['crt', 'fullchain'],
      ['crt', 'chain'],
      ['crt', 'privkey'],
      ['crt', 'bundle'],
      // CER same as DER
      ['cer', 'cert'],
      ['cer', 'fullchain'],
      ['cer', 'chain'],
      ['cer', 'privkey'],
    ];

    const invalidCombinations: Array<[string, string, string]> = [
      ['der', 'bundle', 'DER format does not support bundle'],
      ['p7b', 'privkey', 'P7B format does not support private key'],
      ['p7b', 'bundle', 'P7B format does not support bundle'],
      ['pkcs12', 'chain', 'PKCS12 format requires certificate and private key'],
      ['pkcs12', 'privkey', 'PKCS12 format requires certificate and private key'],
      ['jks', 'chain', 'JKS format requires certificate and private key'],
      ['jks', 'privkey', 'JKS format requires certificate and private key'],
      ['cer', 'bundle', 'DER format does not support bundle'],
    ];

    it('should document valid format-component combinations', () => {
      // This test documents what combinations should work
      expect(validCombinations.length).toBeGreaterThan(0);
      console.log('\nValid format-component combinations:');
      validCombinations.forEach(([format, component]) => {
        console.log(`  ✓ ${format} + ${component}`);
      });
    });

    it('should document invalid format-component combinations', () => {
      // This test documents what combinations should fail
      expect(invalidCombinations.length).toBeGreaterThan(0);
      console.log('\nInvalid format-component combinations:');
      invalidCombinations.forEach(([format, component, reason]) => {
        console.log(`  ✗ ${format} + ${component}: ${reason}`);
      });
    });
  });
});

describe('CertificateDownloadService - Integration Tests', () => {
  let service: CertificateDownloadService;

  beforeEach(() => {
    service = new CertificateDownloadService();
  });

  describe('OpenSSL availability', () => {
    it('should have openssl command available', async () => {
      try {
        const { stdout } = await execAsync('openssl version');
        expect(stdout).toContain('OpenSSL');
        console.log(`\n✓ OpenSSL version: ${stdout.trim()}`);
      } catch (error) {
        throw new Error('OpenSSL is not available. Install it to run conversion tests.');
      }
    });

    it('should support x509 operations', async () => {
      const { stdout } = await execAsync('openssl x509 -help 2>&1 || true');
      expect(stdout).toBeTruthy();
    });

    it('should support pkcs12 operations', async () => {
      const { stdout } = await execAsync('openssl pkcs12 -help 2>&1 || true');
      expect(stdout).toBeTruthy();
    });

    it('should support pkcs7 operations', async () => {
      const { stdout } = await execAsync('openssl crl2pkcs7 -help 2>&1 || true');
      expect(stdout).toBeTruthy();
    });
  });

  describe('Keytool availability (optional for JKS)', () => {
    it('should check if keytool is available', async () => {
      try {
        const { stdout } = await execAsync('keytool -help 2>&1 || true');
        if (stdout.includes('keytool')) {
          console.log('\n✓ Keytool is available - JKS conversion will work');
        } else {
          console.log('\n⚠ Keytool not found - JKS conversion will fail');
          console.log('  Install Java JDK to enable JKS format support');
        }
      } catch (error) {
        console.log('\n⚠ Keytool not available - JKS conversion will fail');
      }
    });
  });
});
