/**
 * Logger Service
 * Centralized logging utility for consistent error/warning/info handling
 * Enables easy switching between console, external logging services, etc.
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown;
}

class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
  }

  private log(entry: LogEntry): void {
    // Store in memory for debugging
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }
    this.logs.push(entry);

    // Console output in development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level);
      const prefix = `[${entry.level}] ${entry.timestamp}`;
      
      if (entry.data !== undefined) {
        console.log(`%c${prefix}`, style, entry.message, entry.data);
      } else {
        console.log(`%c${prefix}`, style, entry.message);
      }
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket) in production
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #gray; font-weight: normal;',
      [LogLevel.INFO]: 'color: #0066cc; font-weight: normal;',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level];
  }

  debug(message: string, data?: unknown): void {
    this.log(this.createEntry(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: unknown): void {
    this.log(this.createEntry(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: unknown): void {
    this.log(this.createEntry(LogLevel.WARN, message, data));
  }

  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error;
    
    this.log(this.createEntry(LogLevel.ERROR, message, errorData));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new LoggerService();
export default logger;
