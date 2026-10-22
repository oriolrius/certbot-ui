import { useState, useRef, useEffect } from 'react';
import {
  parseLogs,
  getLogLevelColor,
  getLogLevelBgColor,
  getLogLevelIcon,
  formatTimestamp,
  type ParsedLogEntry,
  type LogLevel,
} from '@/lib/logParser';
import { Search, Filter, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LogViewerProps {
  logs: string[];
  className?: string;
}

export default function LogViewer({ logs, className = '' }: LogViewerProps) {
  const [parsedLogs, setParsedLogs] = useState<ParsedLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showLevelIcons, setShowLevelIcons] = useState(true);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Parse logs whenever they change
  useEffect(() => {
    setParsedLogs(parseLogs(logs));
  }, [logs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [parsedLogs]);

  // Filter logs based on search and level
  const filteredLogs = parsedLogs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.context?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  // Export logs to text file
  const handleExport = () => {
    const content = filteredLogs.map(log => log.raw).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certbot-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy logs to clipboard
  const handleCopy = async () => {
    const content = filteredLogs.map(log => log.raw).join('\n');
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get unique log levels for filter
  const availableLevels = Array.from(new Set(parsedLogs.map(log => log.level)));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'ALL')}
            className="px-3 py-2 rounded-md border border-input bg-background"
          >
            <option value="ALL">All Levels</option>
            {availableLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="rounded"
            />
            Timestamps
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showLevelIcons}
              onChange={(e) => setShowLevelIcons(e.target.checked)}
              className="rounded"
            />
            Icons
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Display */}
      <div
        ref={logContainerRef}
        className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto border border-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchTerm || levelFilter !== 'ALL' ? 'No logs match your filters' : 'No logs available'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`flex gap-3 px-2 py-1 rounded hover:bg-slate-900/50 transition-colors ${getLogLevelBgColor(log.level)}`}
              >
                {/* Timestamp */}
                {showTimestamps && log.timestamp && (
                  <span className="text-slate-500 shrink-0 w-24">
                    {formatTimestamp(log.timestamp)}
                  </span>
                )}

                {/* Level Icon & Badge */}
                <span className="shrink-0 flex items-center gap-2 min-w-[80px]">
                  {showLevelIcons && (
                    <span className="text-sm">{getLogLevelIcon(log.level)}</span>
                  )}
                  <span className={`text-xs font-semibold ${getLogLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                </span>

                {/* Context (if available) */}
                {log.context && (
                  <span className="text-cyan-400 shrink-0">
                    [{log.context}]
                  </span>
                )}

                {/* Message */}
                <span className={`flex-1 break-all ${getLogLevelColor(log.level)}`}>
                  {log.message || log.raw}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <span>
          Showing {filteredLogs.length} of {parsedLogs.length} log entries
        </span>
        {searchTerm && (
          <span>
            Search: "{searchTerm}"
          </span>
        )}
      </div>
    </div>
  );
}
