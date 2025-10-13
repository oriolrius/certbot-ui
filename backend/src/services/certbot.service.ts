import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import {
  CertbotResult,
  Certificate,
  CertificateRequest,
  RenewalOptions,
  RevocationOptions,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import jobService from './job.service';
import websocketService from './websocket.service';

const execAsync = promisify(exec);

export class CertbotService {
  private certbotPath: string;

  constructor() {
    this.certbotPath = config.certbot.path;
  }

  private sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[;&|`$(){}[\]<>]/g, '');
  }

  private async createManualAuthHook(): Promise<string> {
    const hookPath = path.join('/tmp', 'certbot-manual-auth-hook.sh');
    const challengeFile = path.join('/tmp', 'dns-challenge.json');

    // Create a hook script that stores the challenge info in a file
    const hookScript = `#!/bin/sh
# Store DNS challenge information for the web UI to display

cat > ${challengeFile} << EOF
{
  "domain": "$CERTBOT_DOMAIN",
  "validation": "$CERTBOT_VALIDATION",
  "record_name": "_acme-challenge.$CERTBOT_DOMAIN",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "================================================"
echo "DNS CHALLENGE REQUIRED - Action Needed!"
echo "================================================"
echo ""
echo "Domain: $CERTBOT_DOMAIN"
echo ""
echo "Please add this DNS TXT record to your DNS provider:"
echo ""
echo "  Record Type: TXT"
echo "  Name:        _acme-challenge.$CERTBOT_DOMAIN"
echo "  Value:       $CERTBOT_VALIDATION"
echo "  TTL:         300 (or lowest available)"
echo ""
echo "After adding the record, wait for DNS propagation (5-10 minutes)."
echo ""
echo "Verification commands:"
echo "  dig _acme-challenge.$CERTBOT_DOMAIN TXT +short"
echo "  nslookup -type=TXT _acme-challenge.$CERTBOT_DOMAIN"
echo ""
echo "Waiting 90 seconds for you to add the record and for DNS to propagate..."
echo ""

# Wait for DNS propagation - user should add record during this time
sleep 90
`;

    await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
    return hookPath;
  }

  private async createManualCleanupHook(): Promise<string> {
    const hookPath = path.join('/tmp', 'certbot-manual-cleanup-hook.sh');
    const challengeFile = path.join('/tmp', 'dns-challenge.json');

    const hookScript = `#!/bin/sh
# Cleanup hook - remove challenge file

echo ""
echo "✓ DNS validation successful!"
echo "You can now remove the TXT record: _acme-challenge.$CERTBOT_DOMAIN"
echo ""

rm -f ${challengeFile}
`;

    await fs.writeFile(hookPath, hookScript, { mode: 0o755 });
    return hookPath;
  }

  private async executeCertbot(args: string[]): Promise<CertbotResult> {
    try {
      // Sanitize all arguments
      const sanitizedArgs = args.map((arg) => this.sanitizeInput(arg));

      // Build command with proper escaping
      const command = `${this.certbotPath} ${sanitizedArgs.join(' ')}`;

      logger.info(`Executing certbot command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      logger.info('Certbot command executed successfully');

      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      logger.error(`Certbot command failed: ${err.stderr || err.stdout}`);

      return {
        success: false,
        stdout: err.stdout || '',
        stderr: err.stderr || '',
        exitCode: err.code || 1,
      };
    }
  }

  async listCertificates(): Promise<Certificate[]> {
    // Retry logic for handling concurrent Certbot operations
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeCertbot(['certificates']);

        if (!result.success) {
          // Check if error is due to another Certbot instance running
          if (result.stderr?.includes('Another instance of Certbot is already running')) {
            if (attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
              logger.warn(`Certbot is busy, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue; // Retry
            }
          }
          throw new AppError('Failed to list certificates', 500);
        }

        return this.parseCertificateList(result.stdout);
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(`Error listing certificates after ${maxRetries} attempts: ${error}`);
          throw error;
        }
        // Wait before retry
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Error listing certificates, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new AppError('Failed to list certificates after retries', 500);
  }

  private parseCertificateList(output: string): Certificate[] {
    const certificates: Certificate[] = [];
    const lines = output.split('\n');
    let currentCert: Partial<Certificate> = {};

    for (const line of lines) {
      if (line.includes('Certificate Name:')) {
        if (currentCert.name) {
          certificates.push(currentCert as Certificate);
        }
        currentCert = {
          name: line.split(':')[1].trim(),
          domains: [],
          status: 'valid',
        };
      } else if (line.includes('Domains:')) {
        const domainsStr = line.split(':')[1].trim();
        currentCert.domains = domainsStr.split(' ').filter((d) => d);
      } else if (line.includes('Expiry Date:')) {
        const expiryStr = line.split('Expiry Date:')[1].split('(')[0].trim();
        currentCert.expiry = new Date(expiryStr);

        // Determine status based on expiry
        const now = new Date();
        const daysUntilExpiry = Math.floor(
          (currentCert.expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          currentCert.status = 'expired';
        } else if (daysUntilExpiry < 30) {
          currentCert.status = 'expiring_soon';
        } else {
          currentCert.status = 'valid';
        }
      } else if (line.includes('Serial Number:')) {
        currentCert.serial_number = line.split(':')[1].trim();
      } else if (line.includes('Certificate Path:')) {
        currentCert.path = line.split(':')[1].trim();
      }
    }

    if (currentCert.name) {
      certificates.push(currentCert as Certificate);
    }

    return certificates;
  }

  async obtainCertificate(request: CertificateRequest): Promise<CertbotResult> {
    try {
      // Start with base command - we'll conditionally add --non-interactive
      const args = ['certonly'];

      // Add plugin-specific arguments
      if (request.plugin === 'dns') {
        // Handle DNS challenge
        if (request.dns_provider === 'manual') {
          // For manual DNS validation, we MUST use --non-interactive with hooks
          args.push('--non-interactive');
          args.push('--manual', '--preferred-challenges', 'dns');

          // Create manual auth hook script
          const authHookPath = await this.createManualAuthHook();
          const cleanupHookPath = await this.createManualCleanupHook();

          args.push('--manual-auth-hook', authHookPath);
          args.push('--manual-cleanup-hook', cleanupHookPath);
        } else {
          // Non-interactive for automatic DNS providers
          args.push('--non-interactive');
          // Use DNS provider plugin
          const pluginMap: Record<string, string> = {
            cloudflare: 'dns-cloudflare',
            route53: 'dns-route53',
            digitalocean: 'dns-digitalocean',
            google: 'dns-google',
          };

          const dnsPlugin = pluginMap[request.dns_provider || 'manual'];
          if (dnsPlugin) {
            args.push(`--${dnsPlugin}`);

            // For automatic DNS providers, credentials would typically be stored in a config file
            // This is a simplified implementation - in production, you'd want to:
            // 1. Store credentials securely (encrypted)
            // 2. Write them to a temporary credentials file
            // 3. Pass the credentials file path to certbot
            if (request.dns_credentials) {
              logger.info(`Using ${request.dns_provider} DNS provider with provided credentials`);
              // Note: Actual credential handling would require provider-specific config files
              // This is placeholder for the implementation
            }
          }
        }
      } else {
        // Non-interactive for HTTP-based challenges
        args.push('--non-interactive');
        // HTTP-based challenges
        args.push(`--${request.plugin}`);
      }

      if (request.plugin === 'webroot' && request.webroot_path) {
        args.push('-w', request.webroot_path);
      }

      // Add domains
      request.domains.forEach((domain) => {
        args.push('-d', domain);
      });

      // Add email and agreement
      args.push('--email', request.email);

      if (request.agree_tos) {
        args.push('--agree-tos');
      }

      // Add staging flag if requested
      if (request.staging) {
        args.push('--staging');
      }

      const result = await this.executeCertbot(args);

      if (!result.success) {
        throw new AppError(
          `Failed to obtain certificate: ${result.stderr}`,
          500,
          'CERTBOT_ERROR'
        );
      }

      return result;
    } catch (error) {
      logger.error(`Error obtaining certificate: ${error}`);
      throw error;
    }
  }

  async renewCertificate(options: RenewalOptions = {}): Promise<CertbotResult> {
    try {
      const args = ['renew'];

      if (options.cert_name) {
        args.push('--cert-name', options.cert_name);
      }

      if (options.dry_run) {
        args.push('--dry-run');
      }

      if (options.force_renewal) {
        args.push('--force-renewal');
      }

      const result = await this.executeCertbot(args);

      if (!result.success) {
        throw new AppError(
          `Failed to renew certificate: ${result.stderr}`,
          500,
          'CERTBOT_RENEWAL_ERROR'
        );
      }

      return result;
    } catch (error) {
      logger.error(`Error renewing certificate: ${error}`);
      throw error;
    }
  }

  async revokeCertificate(options: RevocationOptions): Promise<CertbotResult> {
    try {
      const args = ['revoke', '--cert-name', options.cert_name];

      if (options.reason) {
        args.push('--reason', options.reason);
      }

      if (options.delete_after_revoke) {
        args.push('--delete-after-revoke');
      }

      const result = await this.executeCertbot(args);

      if (!result.success) {
        throw new AppError(
          `Failed to revoke certificate: ${result.stderr}`,
          500,
          'CERTBOT_REVOCATION_ERROR'
        );
      }

      return result;
    } catch (error) {
      logger.error(`Error revoking certificate: ${error}`);
      throw error;
    }
  }

  async deleteCertificate(certName: string): Promise<CertbotResult> {
    try {
      const args = ['delete', '--cert-name', certName];

      const result = await this.executeCertbot(args);

      if (!result.success) {
        throw new AppError(
          `Failed to delete certificate: ${result.stderr}`,
          500,
          'CERTBOT_DELETE_ERROR'
        );
      }

      return result;
    } catch (error) {
      logger.error(`Error deleting certificate: ${error}`);
      throw error;
    }
  }

  async getCertificateInfo(certName: string): Promise<Certificate | null> {
    try {
      const certificates = await this.listCertificates();
      return certificates.find((cert) => cert.name === certName) || null;
    } catch (error) {
      logger.error(`Error getting certificate info: ${error}`);
      throw error;
    }
  }

  async getLogs(limit = 100): Promise<string[]> {
    try {
      const logsDir = config.certbot.logsDir;
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter((f) => f.endsWith('.log')).sort().reverse();

      if (logFiles.length === 0) {
        return [];
      }

      const latestLog = path.join(logsDir, logFiles[0]);
      const content = await fs.readFile(latestLog, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim());

      return lines.slice(-limit);
    } catch (error) {
      logger.error(`Error reading logs: ${error}`);
      return [];
    }
  }

  async getDnsChallenge(): Promise<{
    domain: string;
    validation: string;
    record_name: string;
    timestamp: string;
  } | null> {
    try {
      const challengeFile = path.join('/tmp', 'dns-challenge.json');
      const content = await fs.readFile(challengeFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist or can't be read - no active challenge
      return null;
    }
  }

  // Async job-based methods

  async obtainCertificateAsync(jobId: string, userId: string, request: CertificateRequest): Promise<void> {
    try {
      jobService.updateJobStatus(jobId, 'in_progress');
      websocketService.sendOperationProgress(userId, 'obtain', 0, 'Starting certificate request...');

      // Start with base command
      const args = ['certonly'];

      // Add plugin-specific arguments
      if (request.plugin === 'dns') {
        if (request.dns_provider === 'manual') {
          args.push('--non-interactive');
          args.push('--manual', '--preferred-challenges', 'dns');

          // Create manual auth hook script
          const authHookPath = await this.createManualAuthHook();
          const cleanupHookPath = await this.createManualCleanupHook();

          args.push('--manual-auth-hook', authHookPath);
          args.push('--manual-cleanup-hook', cleanupHookPath);

          websocketService.sendOperationProgress(
            userId,
            'obtain',
            10,
            'DNS challenge hooks created, starting validation...'
          );

          // Start monitoring for DNS challenge file
          this.monitorDnsChallenge(jobId, userId);
        } else {
          args.push('--non-interactive');
          const pluginMap: Record<string, string> = {
            cloudflare: 'dns-cloudflare',
            route53: 'dns-route53',
            digitalocean: 'dns-digitalocean',
            google: 'dns-google',
          };

          const dnsPlugin = pluginMap[request.dns_provider || 'manual'];
          if (dnsPlugin) {
            args.push(`--${dnsPlugin}`);

            if (request.dns_credentials) {
              logger.info(`Using ${request.dns_provider} DNS provider with provided credentials`);
            }
          }
        }
      } else {
        args.push('--non-interactive');
        args.push(`--${request.plugin}`);
      }

      if (request.plugin === 'webroot' && request.webroot_path) {
        args.push('-w', request.webroot_path);
      }

      request.domains.forEach((domain) => {
        args.push('-d', domain);
      });

      args.push('--email', request.email);

      if (request.agree_tos) {
        args.push('--agree-tos');
      }

      if (request.staging) {
        args.push('--staging');
      }

      websocketService.sendOperationProgress(userId, 'obtain', 20, 'Executing certbot command...');

      const result = await this.executeCertbot(args);

      jobService.completeJob(jobId, result);

      if (result.success) {
        websocketService.sendOperationComplete(userId, 'obtain', true, result);
        websocketService.sendCertificateUpdate(userId, 'obtained', { domains: request.domains });
      } else {
        websocketService.sendOperationComplete(userId, 'obtain', false, {
          error: result.stderr,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in obtainCertificateAsync: ${errorMsg}`);
      jobService.failJob(jobId, errorMsg);
      websocketService.sendOperationComplete(userId, 'obtain', false, { error: errorMsg });
    }
  }

  async renewCertificateAsync(jobId: string, userId: string, options: RenewalOptions): Promise<void> {
    try {
      jobService.updateJobStatus(jobId, 'in_progress');
      websocketService.sendOperationProgress(userId, 'renew', 0, 'Starting certificate renewal...');

      const args = ['renew'];

      if (options.cert_name) {
        args.push('--cert-name', options.cert_name);
      }

      if (options.dry_run) {
        args.push('--dry-run');
      }

      if (options.force_renewal) {
        args.push('--force-renewal');
      }

      websocketService.sendOperationProgress(userId, 'renew', 20, 'Executing renewal command...');

      const result = await this.executeCertbot(args);

      jobService.completeJob(jobId, result);

      if (result.success) {
        websocketService.sendOperationComplete(userId, 'renew', true, result);
        if (options.cert_name) {
          websocketService.sendCertificateUpdate(userId, 'renewed', { certName: options.cert_name });
        }
      } else {
        websocketService.sendOperationComplete(userId, 'renew', false, {
          error: result.stderr,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in renewCertificateAsync: ${errorMsg}`);
      jobService.failJob(jobId, errorMsg);
      websocketService.sendOperationComplete(userId, 'renew', false, { error: errorMsg });
    }
  }

  async revokeCertificateAsync(jobId: string, userId: string, options: RevocationOptions): Promise<void> {
    try {
      jobService.updateJobStatus(jobId, 'in_progress');
      websocketService.sendOperationProgress(userId, 'revoke', 0, 'Starting certificate revocation...');

      const args = ['revoke', '--cert-name', options.cert_name];

      if (options.reason) {
        args.push('--reason', options.reason);
      }

      if (options.delete_after_revoke) {
        args.push('--delete-after-revoke');
      }

      websocketService.sendOperationProgress(userId, 'revoke', 20, 'Executing revocation command...');

      const result = await this.executeCertbot(args);

      jobService.completeJob(jobId, result);

      if (result.success) {
        websocketService.sendOperationComplete(userId, 'revoke', true, result);
        websocketService.sendCertificateUpdate(userId, 'revoked', { certName: options.cert_name });
      } else {
        websocketService.sendOperationComplete(userId, 'revoke', false, {
          error: result.stderr,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in revokeCertificateAsync: ${errorMsg}`);
      jobService.failJob(jobId, errorMsg);
      websocketService.sendOperationComplete(userId, 'revoke', false, { error: errorMsg });
    }
  }

  async deleteCertificateAsync(jobId: string, userId: string, certName: string): Promise<void> {
    try {
      jobService.updateJobStatus(jobId, 'in_progress');
      websocketService.sendOperationProgress(userId, 'delete', 0, 'Starting certificate deletion...');

      const args = ['delete', '--cert-name', certName];

      websocketService.sendOperationProgress(userId, 'delete', 20, 'Executing deletion command...');

      const result = await this.executeCertbot(args);

      jobService.completeJob(jobId, result);

      if (result.success) {
        websocketService.sendOperationComplete(userId, 'delete', true, result);
        websocketService.sendCertificateUpdate(userId, 'deleted', { certName });
      } else {
        websocketService.sendOperationComplete(userId, 'delete', false, {
          error: result.stderr,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in deleteCertificateAsync: ${errorMsg}`);
      jobService.failJob(jobId, errorMsg);
      websocketService.sendOperationComplete(userId, 'delete', false, { error: errorMsg });
    }
  }

  private async monitorDnsChallenge(jobId: string, userId: string): Promise<void> {
    const challengeFile = path.join('/tmp', 'dns-challenge.json');
    let attempts = 0;
    const maxAttempts = 120; // Check for 2 minutes (120 * 1 second)

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        const content = await fs.readFile(challengeFile, 'utf-8');
        const challenge = JSON.parse(content);

        // Update job with DNS challenge info
        jobService.updateJobDnsChallenge(jobId, challenge);

        // Send WebSocket notification
        websocketService.broadcast(
          {
            type: 'dns_challenge',
            payload: challenge,
          },
          userId
        );

        logger.info(`DNS challenge detected for job ${jobId}: ${challenge.domain}`);
        clearInterval(checkInterval);
      } catch (error) {
        // File doesn't exist yet, keep checking
        if (attempts >= maxAttempts) {
          logger.warn(`DNS challenge file not found after ${maxAttempts} attempts for job ${jobId}`);
          clearInterval(checkInterval);
        }
      }
    }, 1000); // Check every second
  }
}

export default new CertbotService();
