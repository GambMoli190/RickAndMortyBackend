import { config } from '../config/environment';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
  };

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    const currentLevel = levels[config.logLevel as LogLevel] ?? levels.info;
    const messageLevel = levels[level];

    return messageLevel <= currentLevel;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase();

    let colorCode = this.colors.reset;
    switch (level) {
      case 'error':
        colorCode = this.colors.red;
        break;
      case 'warn':
        colorCode = this.colors.yellow;
        break;
      case 'info':
        colorCode = this.colors.blue;
        break;
      case 'debug':
        colorCode = this.colors.cyan;
        break;
    }

    const formattedArgs = args.length > 0
      ? ' ' + args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      : '';

    return `${colorCode}[${timestamp}] ${levelUpper}:${this.colors.reset} ${message}${formattedArgs}`;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, ...args);

    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  public error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }
}

export const logger = new Logger();