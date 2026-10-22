import { describe, it, expect } from 'vitest';
import config from '../config';

describe('Config', () => {
  it('should have default port', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });

  it('should listen on all IPv4 interfaces by default', () => {
    // Without an explicit host Node binds to '::', which WSL2 does not forward
    expect(config.host).toBe(process.env.HOST || '0.0.0.0');
  });

  it('should have jwt configuration', () => {
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
  });

  it('should have cors configuration', () => {
    expect(config.cors).toBeDefined();
    expect(Array.isArray(config.cors.allowedOrigins)).toBe(true);
  });

  it('should have certbot configuration', () => {
    expect(config.certbot).toBeDefined();
    expect(config.certbot.path).toBeDefined();
    expect(config.certbot.configDir).toBeDefined();
  });

  it('should have rate limit configuration', () => {
    expect(config.rateLimit).toBeDefined();
    expect(config.rateLimit.windowMs).toBeDefined();
    expect(config.rateLimit.maxRequests).toBeDefined();
  });
});
