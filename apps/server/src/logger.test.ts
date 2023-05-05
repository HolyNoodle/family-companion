import Logger, { LogLevel } from "./logger";

describe("Logger", () => {
  const log = jest.spyOn(global.console, "log");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2023, 0, 1, 10, 10, 0, 0)));
  });

  it("Should instanciate logger", () => {
    const logger = new Logger();

    expect(logger).toBeInstanceOf(Logger);
  });

  it("Should call logger.log with DEBUG info", () => {
    const logger = new Logger();

    logger["log"] = jest.fn();

    logger.debug("youhouh", "test");

    expect(logger["log"]).toHaveBeenCalledTimes(1);
    expect(logger["log"]).toHaveBeenCalledWith(
      LogLevel.DEBUG,
      "youhouh",
      "test"
    );
  });
  it("Should call logger.log with INFO info", () => {
    const logger = new Logger();

    logger["log"] = jest.fn();

    logger.info("youhouh", "test");

    expect(logger["log"]).toHaveBeenCalledTimes(1);
    expect(logger["log"]).toHaveBeenCalledWith(
      LogLevel.INFO,
      "youhouh",
      "test"
    );
  });
  it("Should call logger.log with WARNING info", () => {
    const logger = new Logger();

    logger["log"] = jest.fn();

    logger.warn("youhouh", "test");

    expect(logger["log"]).toHaveBeenCalledTimes(1);
    expect(logger["log"]).toHaveBeenCalledWith(
      LogLevel.WARNING,
      "youhouh",
      "test"
    );
  });
  it("Should call logger.log with ERROR info", () => {
    const logger = new Logger();

    logger["log"] = jest.fn();

    logger.error("youhouh", "test");

    expect(logger["log"]).toHaveBeenCalledTimes(1);
    expect(logger["log"]).toHaveBeenCalledWith(
      LogLevel.ERROR,
      "youhouh",
      "test"
    );
  });

  it("Should call console.log", () => {
    const logger = new Logger();

    const log = jest.spyOn(global.console, "log");

    logger["log"](LogLevel.ERROR, "youhouh", "test");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      "2023-01-01T10:10:00.000Z [ERROR] youhouh test"
    );
  });

  it("Should not call console.log when log level is less than min log level", () => {
    const logger = new Logger(LogLevel.INFO);

    const log = jest.spyOn(global.console, "log");

    logger["log"](LogLevel.DEBUG, "youhouh", "test");

    expect(log).toHaveBeenCalledTimes(0);
  });

  it("Should keep memory under 1000", () => {
    const logger = new Logger();

    for(let i = 0; i < 1000; i++) {
      logger.memory.push("test");
    }

    logger["log"](LogLevel.INFO, "youhouh", "test");

    expect(log).toHaveBeenCalledTimes(1);
    expect(logger.memory).toHaveLength(1000);
  });
});
