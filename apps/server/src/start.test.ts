import { JobScheduler } from "./domains/Job";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import NotificationManager from "./domains/Notification";
import API from "./domains/API";
import { existsSync, readFileSync } from "fs";
import Logger, { LogLevel } from "./logger";

import { start } from "./start";
import { getTranslator } from "@famcomp/translations";

jest.mock("./domains/Job");
jest.mock("./domains/API");
jest.mock("./domains/Notification");
jest.mock("./logger");
jest.mock("fs");
jest.mock("@famcomp/home-assistant");

process.env.SUPERVISOR_TOKEN = "test_token";

describe("Application startup", () => {
  const connection = new HomeAssistantConnection("fdsfdsqfs");
  const logger = new Logger();
  const translator = getTranslator("en");

  beforeEach(() => {
    jest.clearAllMocks();

    (HomeAssistantConnection as any).mockReturnValue(connection);
    (Logger as any).mockReturnValue(logger);
    (HomeAssistantConnection.prototype.start as any).mockResolvedValue(true);
    (HomeAssistantConnection.prototype.getPersons as any).mockResolvedValue([
      { id: "person" },
    ]);
  });

  describe("Home assistant connection", () => {
    it("Should initialize home assistant connection", async () => {
      await start();

      expect(HomeAssistantConnection).toHaveBeenCalledTimes(1);
      expect(HomeAssistantConnection).toHaveBeenCalledWith("test_token");
      expect(HomeAssistantConnection.prototype.start).toHaveBeenCalledTimes(1);
      expect(HomeAssistantConnection.prototype.start).toHaveBeenCalledWith();
    });
  });

  describe("Job scheduler", () => {
    it("Should initialize job scheduler", async () => {
      await start();

      expect(JobScheduler).toHaveBeenCalledTimes(1);
      expect(JobScheduler).toHaveBeenCalledWith(
        {
          persons: [{ id: "person" }],
          tasks: [],
        },
        logger
      );
      expect(JobScheduler.prototype.start).toHaveBeenCalledTimes(1);
      expect(JobScheduler.prototype.start).toHaveBeenCalledWith();
    });
  });

  describe("Notification manager", () => {
    it("Should initialize notification manager", async () => {
      await start();

      expect(NotificationManager).toHaveBeenCalledTimes(1);
      expect(NotificationManager).toHaveBeenCalledWith(
        connection,
        {
          persons: [{ id: "person" }],
          tasks: [],
        },
        translator,
        logger,
        undefined
      );
    });
  });
});
