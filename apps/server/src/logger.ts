export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  log(
    logLevel: LogLevel,
    ...args: Array<string | number | { toString: () => string }>
  ) {
    if (logLevel < this.level) {
      return;
    }

    const date = new Date();

    console.log(date.toISOString(), `[${LogLevel[logLevel]}]`, ...args);
  }

  info(...args: Array<string | number | { toString: () => string }>) {
    this.log(LogLevel.INFO, ...args);
  }
  debug(...args: Array<string | number | { toString: () => string }>) {
    this.log(LogLevel.DEBUG, ...args);
  }
  warn(...args: Array<string | number | { toString: () => string }>) {
    this.log(LogLevel.WARNING, ...args);
  }
  error(...args: Array<string | number | { toString: () => string }>) {
    this.log(LogLevel.ERROR, ...args);
  }
}

export default Logger;
