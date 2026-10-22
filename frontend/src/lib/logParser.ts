/**
 * Log Parser Utility
 * Parses certbot and application logs into structured format for better visualization
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SUCCESS' | 'UNKNOWN';

export interface ParsedLogEntry {
  timestamp: string | null;
  level: LogLevel;
  message: string;
  raw: string;
  context?: string;
}

/**
 * Parses a log line and extracts timestamp, log level, and message
 */
export function parseLogLine(line: string): ParsedLogEntry {
  const raw = line;

  // Pattern 1: Standard certbot/Python logging format
  // 2024-01-15 10:30:45,123:DEBUG:certbot.main:Starting Certbot
  const pythonLogPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[,.]?\d*):?(DEBUG|INFO|WARNING|ERROR|CRITICAL)?:?([^:]*):(.*)$/;

  // Pattern 2: ISO timestamp format
  // 2024-01-15T10:30:45.123Z [INFO] Message
  const isoLogPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.,]?\d*Z?)\s*\[?(DEBUG|INFO|WARNING|ERROR|CRITICAL|SUCCESS)?\]?\s*(.*)$/;

  // Pattern 3: Simple timestamp
  // [2024-01-15 10:30:45] INFO: Message
  const simpleLogPattern = /^\[?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]?\s*\[?(DEBUG|INFO|WARNING|ERROR|CRITICAL|SUCCESS)?\]?:?\s*(.*)$/;

  // Pattern 4: No timestamp, just level
  // DEBUG: Message or [DEBUG] Message
  const levelOnlyPattern = /^\[?(DEBUG|INFO|WARNING|ERROR|CRITICAL|SUCCESS)\]?:?\s*(.*)$/i;

  let match;

  // Try Python logging format first (most common for certbot)
  if ((match = line.match(pythonLogPattern))) {
    return {
      timestamp: match[1],
      level: (match[2] as LogLevel) || 'INFO',
      context: match[3]?.trim() || undefined,
      message: match[4]?.trim() || '',
      raw,
    };
  }

  // Try ISO format
  if ((match = line.match(isoLogPattern))) {
    return {
      timestamp: match[1],
      level: (match[2] as LogLevel) || 'INFO',
      message: match[3]?.trim() || '',
      raw,
    };
  }

  // Try simple format
  if ((match = line.match(simpleLogPattern))) {
    return {
      timestamp: match[1],
      level: (match[2] as LogLevel) || 'INFO',
      message: match[3]?.trim() || '',
      raw,
    };
  }

  // Try level only
  if ((match = line.match(levelOnlyPattern))) {
    return {
      timestamp: null,
      level: match[1].toUpperCase() as LogLevel,
      message: match[2]?.trim() || '',
      raw,
    };
  }

  // Detect implicit log levels from content
  const lowercaseLine = line.toLowerCase();
  let implicitLevel: LogLevel = 'INFO';

  if (lowercaseLine.includes('error') || lowercaseLine.includes('failed') || lowercaseLine.includes('exception')) {
    implicitLevel = 'ERROR';
  } else if (lowercaseLine.includes('warn') || lowercaseLine.includes('deprecated')) {
    implicitLevel = 'WARNING';
  } else if (lowercaseLine.includes('success') || lowercaseLine.includes('✓') || lowercaseLine.includes('completed')) {
    implicitLevel = 'SUCCESS';
  } else if (lowercaseLine.includes('debug') || lowercaseLine.includes('trace')) {
    implicitLevel = 'DEBUG';
  }

  // No recognizable pattern - treat as plain text
  return {
    timestamp: null,
    level: implicitLevel,
    message: line.trim(),
    raw,
  };
}

/**
 * Parses multiple log lines
 */
export function parseLogs(lines: string[]): ParsedLogEntry[] {
  return lines
    .filter(line => line.trim().length > 0)
    .map(parseLogLine);
}

/**
 * Get color class for log level (Tailwind CSS classes)
 */
export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'DEBUG':
      return 'text-gray-400';
    case 'INFO':
      return 'text-blue-400';
    case 'SUCCESS':
      return 'text-green-400';
    case 'WARNING':
      return 'text-yellow-400';
    case 'ERROR':
      return 'text-red-400';
    case 'CRITICAL':
      return 'text-red-600 font-bold';
    default:
      return 'text-gray-300';
  }
}

/**
 * Get background color class for log level
 */
export function getLogLevelBgColor(level: LogLevel): string {
  switch (level) {
    case 'DEBUG':
      return 'bg-gray-600/20';
    case 'INFO':
      return 'bg-blue-600/20';
    case 'SUCCESS':
      return 'bg-green-600/20';
    case 'WARNING':
      return 'bg-yellow-600/20';
    case 'ERROR':
      return 'bg-red-600/20';
    case 'CRITICAL':
      return 'bg-red-600/40';
    default:
      return 'bg-transparent';
  }
}

/**
 * Get icon for log level
 */
export function getLogLevelIcon(level: LogLevel): string {
  switch (level) {
    case 'DEBUG':
      return '🔍';
    case 'INFO':
      return 'ℹ️';
    case 'SUCCESS':
      return '✅';
    case 'WARNING':
      return '⚠️';
    case 'ERROR':
      return '❌';
    case 'CRITICAL':
      return '🔥';
    default:
      return '•';
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp.replace(',', '.'));
    if (isNaN(date.getTime())) return timestamp;

    // Format with milliseconds manually since fractionalSecondDigits isn't widely supported
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  } catch {
    return timestamp;
  }
}
