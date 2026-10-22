import { describe, it, expect } from 'vitest';
import { parseLogLine, parseLogs, getLogLevelColor, formatTimestamp } from '../logParser';

describe('logParser', () => {
  describe('parseLogLine', () => {
    it('should parse Python logging format', () => {
      const line = '2024-01-15 10:30:45,123:INFO:certbot.main:Starting Certbot';
      const result = parseLogLine(line);

      expect(result.timestamp).toBe('2024-01-15 10:30:45,123');
      expect(result.level).toBe('INFO');
      expect(result.context).toBe('certbot.main');
      expect(result.message).toBe('Starting Certbot');
    });

    it('should parse ISO timestamp format', () => {
      const line = '2024-01-15T10:30:45.123Z [INFO] Starting process';
      const result = parseLogLine(line);

      expect(result.timestamp).toBe('2024-01-15T10:30:45.123Z');
      expect(result.level).toBe('INFO');
      expect(result.message).toBe('Starting process');
    });

    it('should parse simple timestamp format', () => {
      const line = '[2024-01-15 10:30:45] ERROR: Connection failed';
      const result = parseLogLine(line);

      expect(result.timestamp).toBe('2024-01-15 10:30:45');
      expect(result.level).toBe('ERROR');
      expect(result.message).toBe('Connection failed');
    });

    it('should parse level-only format', () => {
      const line = 'DEBUG: Checking configuration';
      const result = parseLogLine(line);

      expect(result.timestamp).toBeNull();
      expect(result.level).toBe('DEBUG');
      expect(result.message).toBe('Checking configuration');
    });

    it('should detect implicit ERROR level', () => {
      const line = 'Failed to connect to server';
      const result = parseLogLine(line);

      expect(result.level).toBe('ERROR');
      expect(result.message).toBe('Failed to connect to server');
    });

    it('should detect implicit WARNING level', () => {
      const line = 'Warning: This feature is deprecated';
      const result = parseLogLine(line);

      expect(result.level).toBe('WARNING');
    });

    it('should detect implicit SUCCESS level', () => {
      const line = '✓ Certificate obtained successfully';
      const result = parseLogLine(line);

      expect(result.level).toBe('SUCCESS');
    });

    it('should handle plain text without level', () => {
      const line = 'This is a plain log message';
      const result = parseLogLine(line);

      expect(result.level).toBe('INFO');
      expect(result.message).toBe('This is a plain log message');
    });
  });

  describe('parseLogs', () => {
    it('should parse multiple log lines', () => {
      const lines = [
        '2024-01-15 10:30:45,123:INFO:certbot.main:Starting',
        '2024-01-15 10:30:46,456:ERROR:certbot.main:Failed',
        '',
        '2024-01-15 10:30:47,789:DEBUG:certbot.main:Debug info',
      ];

      const result = parseLogs(lines);

      expect(result).toHaveLength(3); // Empty line filtered out
      expect(result[0].level).toBe('INFO');
      expect(result[1].level).toBe('ERROR');
      expect(result[2].level).toBe('DEBUG');
    });
  });

  describe('getLogLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getLogLevelColor('DEBUG')).toBe('text-gray-400');
      expect(getLogLevelColor('INFO')).toBe('text-blue-400');
      expect(getLogLevelColor('SUCCESS')).toBe('text-green-400');
      expect(getLogLevelColor('WARNING')).toBe('text-yellow-400');
      expect(getLogLevelColor('ERROR')).toBe('text-red-400');
      expect(getLogLevelColor('CRITICAL')).toBe('text-red-600 font-bold');
      expect(getLogLevelColor('UNKNOWN')).toBe('text-gray-300');
    });
  });

  describe('formatTimestamp', () => {
    it('should format valid timestamp', () => {
      const timestamp = '2024-01-15 10:30:45,123';
      const result = formatTimestamp(timestamp);

      // Should return a formatted time string
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return empty string for null', () => {
      expect(formatTimestamp(null)).toBe('');
    });

    it('should return original for invalid timestamp', () => {
      const invalid = 'not a timestamp';
      expect(formatTimestamp(invalid)).toBe(invalid);
    });
  });
});
