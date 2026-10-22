import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { CertificateRequest } from '../types';

// Credentials files must live under the (persistent) Let's Encrypt config dir,
// because certbot stores their path in the renewal config and reuses it on renew.
const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'certbot-ui-le-'));
process.env.CERTBOT_CONFIG_DIR = configDir;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let service: any;

const dnsRequest = (
  dns_provider: CertificateRequest['dns_provider'],
  dns_credentials: Record<string, string>,
  domains = ['www.example.com']
): CertificateRequest => ({
  domains,
  email: 'ops@example.com',
  plugin: 'dns',
  dns_provider,
  dns_credentials,
  agree_tos: true,
});

const argAfter = (args: string[], flag: string): string | undefined =>
  args[args.indexOf(flag) + 1];

const mode = (file: string): number => fs.statSync(file).mode & 0o777;

describe('CertbotService DNS provider credentials', () => {
  beforeAll(async () => {
    const { CertbotService } = await import('../services/certbot.service');
    service = new CertbotService();
  });

  afterAll(() => {
    fs.rmSync(configDir, { recursive: true, force: true });
  });

  it('stores Cloudflare credentials per certificate under the config dir', async () => {
    const args: string[] = [];
    await service.addDnsPluginArgs(args, dnsRequest('cloudflare', { api_token: 'cf-token' }, ['*.example.com', 'example.com']));

    const credentials = argAfter(args, '--dns-cloudflare-credentials')!;
    expect(args).toContain('--dns-cloudflare');
    expect(credentials.startsWith(configDir)).toBe(true);
    expect(path.basename(credentials)).toBe('wildcard.example.com-cloudflare.ini');
    expect(fs.readFileSync(credentials, 'utf8')).toContain('dns_cloudflare_api_token = cf-token');
    expect(mode(credentials)).toBe(0o600);
  });

  it('passes Route53 credentials through AWS_SHARED_CREDENTIALS_FILE, not a CLI flag', async () => {
    const args: string[] = [];
    await service.addDnsPluginArgs(
      args,
      dnsRequest('route53', { aws_access_key_id: 'AKIA123', aws_secret_access_key: 'secret' })
    );

    expect(args).toEqual(['--dns-route53']);

    const env = service.certbotEnv();
    const credentials = env.AWS_SHARED_CREDENTIALS_FILE;
    expect(credentials.startsWith(configDir)).toBe(true);
    expect(fs.readFileSync(credentials, 'utf8')).toContain('aws_access_key_id = AKIA123');
    expect(mode(credentials)).toBe(0o600);
  });

  it('supports DigitalOcean API tokens', async () => {
    const args: string[] = [];
    await service.addDnsPluginArgs(args, dnsRequest('digitalocean', { api_token: 'do-token' }));

    const credentials = argAfter(args, '--dns-digitalocean-credentials')!;
    expect(args).toContain('--dns-digitalocean');
    expect(fs.readFileSync(credentials, 'utf8')).toContain('dns_digitalocean_token = do-token');
  });

  it('rejects incomplete credentials', async () => {
    await expect(service.addDnsPluginArgs([], dnsRequest('route53', { aws_access_key_id: 'AKIA123' }))).rejects.toThrow(
      /aws_secret_access_key/
    );
  });
});
