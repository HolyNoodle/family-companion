export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR,
}

class Logger {
  public memory: string[];
  constructor(private level: LogLevel = LogLevel.INFO, private memorySize = 1000) {
    this.memory = [];
  }

  log(
    logLevel: LogLevel,
    ...args: Array<string | number | { toString: () => string }>
  ) {
    if (logLevel < this.level) {
      return;
    }

    const date = new Date();

    const message = [date.toISOString(), `[${LogLevel[logLevel]}]`, ...args].join(" ");

    this.memory.push(message);

    if(this.memory.length > this.memorySize) {
      this.memory.shift();
    }

    console.log(message);
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
