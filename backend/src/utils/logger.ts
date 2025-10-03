import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Log interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

// Logger class
class Logger {
  private logFile: string;
  private errorFile: string;

  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
    this.errorFile = path.join(logsDir, 'error.log');
  }

  private formatLog(level: LogLevel, message: string, data?: any, stack?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: stack || ''
    };
  }

  private writeToFile(filename: string, logEntry: LogEntry): void {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(filename, logLine);
  }

  private log(level: LogLevel, message: string, data?: any, stack?: string): void {
    const logEntry = this.formatLog(level, message, data, stack);
    
    // Console output
    const consoleMessage = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`;
    if (data) {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage);
    }

    // File output
    this.writeToFile(this.logFile, logEntry);
    
    // Error file for errors
    if (level === LogLevel.ERROR) {
      this.writeToFile(this.errorFile, logEntry);
    }
  }

  error(message: string, data?: any, stack?: string): void {
    this.log(LogLevel.ERROR, message, data, stack);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  // HTTP request logger
  httpRequest(req: any, res: any, responseTime: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    this.info('HTTP Request', logData);
  }

  // Database operation logger
  dbOperation(operation: string, collection: string, data?: any): void {
    this.info(`Database ${operation}`, { collection, data });
  }

  // Authentication logger
  authEvent(event: string, userId?: string, data?: any): void {
    this.info(`Auth ${event}`, { userId, data });
  }

  // Error logger with stack trace
  logError(error: Error, context?: string): void {
    this.error(`Error${context ? ` in ${context}` : ''}`, {
      name: error.name,
      message: error.message
    }, error.stack);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;








