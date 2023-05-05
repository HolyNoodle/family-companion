import { JobScheduler } from "./domains/Job";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import NotificationManager from "./domains/Notification";
import Logger from "./logger";
import { State } from "./state";

import { start } from "./start";
import { getTranslator } from "@famcomp/translations";
import { AppState } from "./types";
import API from "./domains/API";

jest.mock("./state");
jest.mock("./domains/Job");
jest.mock("./domains/API");
jest.mock("./domains/Notification");
jest.mock("./logger");
jest.mock("fs");
jest.mock("@famcomp/home-assistant");
jest.mock("@famcomp/translations");

describe("Application startup", () => {
  const connection = new HomeAssistantConnection("fdsfdsqfs");
  const logger = new Logger();
  const translator = getTranslator("en");
  const state: AppState = {
    tasks: [{ id: "task_id" } as any],
    persons: [],
  };
  const expressApp = { close: jest.fn() };
  const notification = new NotificationManager(
    connection,
    state,
    translator,
    logger
  );
  const jobScheduler = new JobScheduler(state, logger);
  const process = {
    env: {
      SUPERVISOR_TOKEN: "test_token",
    },
    on: jest.fn(),
    exit: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    (HomeAssistantConnection as any).mockReturnValue(connection);
    (NotificationManager as any).mockReturnValue(notification);
    (JobScheduler as any).mockReturnValue(jobScheduler);
    (State.get as any).mockReturnValue(state);
    (Logger as any).mockReturnValue(logger);
    (API as any).mockReturnValue(expressApp);
    (getTranslator as any).mockReturnValue(translator);
    (HomeAssistantConnection.prototype.start as any).mockResolvedValue(true);
    (HomeAssistantConnection.prototype.getPersons as any).mockResolvedValue([
      { id: "person" },
    ]);
  });

  describe("Home assistant connection", () => {
    it("Should initialize home assistant connection", async () => {
      await start(process);

      expect(HomeAssistantConnection).toHaveBeenCalledTimes(1);
      expect(HomeAssistantConnection).toHaveBeenCalledWith("test_token");
      expect(HomeAssistantConnection.prototype.start).toHaveBeenCalledTimes(1);
      expect(HomeAssistantConnection.prototype.start).toHaveBeenCalledWith();
    });

    it("Should subscribe to trigger_task event", async () => {
      await start(process);

      expect(
        HomeAssistantConnection.prototype.subscribeToEvent
      ).toHaveBeenCalledTimes(1);
      expect(
        HomeAssistantConnection.prototype.subscribeToEvent
      ).toHaveBeenCalledWith("trigger_task");
      expect(
        HomeAssistantConnection.prototype.addListener
      ).toHaveBeenCalledTimes(1);
      const [event, listener] = (
        HomeAssistantConnection.prototype.addListener as any
      ).mock.calls[0];
      expect(event).toBe("trigger_task");

      listener({ id: "task_id" });

      expect(jobScheduler.triggerTask).toHaveBeenCalledTimes(1);
      expect(jobScheduler.triggerTask).toHaveBeenCalledWith(state.tasks[0]);
    });

    it("Should not when id does not exists trigger_task event", async () => {
      await start(process);

      expect(
        HomeAssistantConnection.prototype.subscribeToEvent
      ).toHaveBeenCalledTimes(1);
      expect(
        HomeAssistantConnection.prototype.subscribeToEvent
      ).toHaveBeenCalledWith("trigger_task");
      expect(
        HomeAssistantConnection.prototype.addListener
      ).toHaveBeenCalledTimes(1);
      const [event, listener] = (
        HomeAssistantConnection.prototype.addListener as any
      ).mock.calls[0];
      expect(event).toBe("trigger_task");

      listener({ id: "task_id2" });

      expect(jobScheduler.triggerTask).toHaveBeenCalledTimes(0);
    });
  });

  describe("Translations", () => {
    it("Should initialize translator", async () => {
      await start(process);

      expect(getTranslator).toHaveBeenCalledTimes(1);
      expect(getTranslator).toHaveBeenCalledWith("en");
    });
  });

  describe("Config", () => {
    it("Should return default config", async () => {
      await start(process);

      expect(getTranslator).toHaveBeenCalledTimes(1);
      expect(getTranslator).toHaveBeenCalledWith("en");
    });
  });

  describe("State", () => {
    it("Should initialize state", async () => {
      await start(process);

      expect(State.get).toHaveBeenCalledTimes(1);
      expect(State.get).toHaveBeenCalledWith();
    });

    it("Should get persons", async () => {
      await start(process);

      expect(
        HomeAssistantConnection.prototype.getPersons
      ).toHaveBeenCalledTimes(1);
      expect(
        HomeAssistantConnection.prototype.getPersons
      ).toHaveBeenCalledWith();
      expect(state.persons).toStrictEqual([
        {
          id: "person",
        },
      ]);
    });
  });

  describe("API", () => {
    it("Should initialize API", async () => {
      await start(process);

      expect(API).toHaveBeenCalledTimes(1);
      expect(API).toHaveBeenCalledWith(
        state,
        notification,
        jobScheduler,
        logger,
        expect.anything()
      );
    });

    it("Should trigger api close", async () => {
      await start(process);

      const callback = (API as any).mock.calls[0][4];

      callback();

      expect(JobScheduler.prototype.stop).toHaveBeenCalledTimes(1);
      expect(JobScheduler.prototype.stop).toHaveBeenCalledWith();
      expect(HomeAssistantConnection.prototype.stop).toHaveBeenCalledTimes(1);
      expect(HomeAssistantConnection.prototype.stop).toHaveBeenCalledWith();
    });
  });

  describe("Job scheduler", () => {
    it("Should initialize job scheduler", async () => {
      await start(process);

      expect(JobScheduler).toHaveBeenCalledTimes(1);
      expect(JobScheduler).toHaveBeenCalledWith(state, logger);
      expect(JobScheduler.prototype.start).toHaveBeenCalledTimes(1);
      expect(JobScheduler.prototype.start).toHaveBeenCalledWith();
    });

    it("Should add listener on job scheduler", async () => {
      await start(process);

      expect(JobScheduler.prototype.on).toHaveBeenCalledTimes(1);
      const [event, listener] = (JobScheduler.prototype.on as any).mock
        .calls[0];

      expect(event).toBe("start_job");

      listener(state.tasks[0], { id: "jobId" });

      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith(
        state.tasks[0]
      );
      expect(HomeAssistantConnection.prototype.fireEvent).toHaveBeenCalledTimes(
        1
      );
      expect(HomeAssistantConnection.prototype.fireEvent).toHaveBeenCalledWith(
        "task_triggered",
        { task: state.tasks[0], job: { id: "jobId" } }
      );
      expect(State.set).toHaveBeenCalledTimes(1);
      expect(State.set).toHaveBeenCalledWith(state);
    });
  });

  describe("Notification manager", () => {
    it("Should initialize notification manager", async () => {
      await start(process);

      expect(NotificationManager).toHaveBeenCalledTimes(1);
      expect(NotificationManager).toHaveBeenCalledWith(
        connection,
        state,
        translator,
        logger,
        undefined
      );
      expect(
        NotificationManager.prototype.syncNotifications
      ).toHaveBeenCalledTimes(1);
      expect(
        NotificationManager.prototype.syncNotifications
      ).toHaveBeenCalledWith();
    });

    it("Should listen to notification actions", async () => {
      await start(process);

      expect(NotificationManager.prototype.on).toHaveBeenCalledTimes(1);
      const [event, listener] = (NotificationManager.prototype.on as any).mock
        .calls[0];
      expect(event).toBe("action");
    });

    it("Should should trigger task", async () => {
      await start(process);

      const [_, listener] = (NotificationManager.prototype.on as any).mock
        .calls[0];

      listener("trigger", state.tasks[0]);

      expect(jobScheduler.triggerTask).toHaveBeenCalledTimes(1);
      expect(jobScheduler.triggerTask).toHaveBeenCalledWith(state.tasks[0]);

      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith(
        state.tasks[0]
      );
    });

    it("Should should complete job", async () => {
      await start(process);

      const [_, listener] = (NotificationManager.prototype.on as any).mock
        .calls[0];

      const job = { id: "jobId" };
      listener("complete", state.tasks[0], job, "person.test");

      expect(jobScheduler.completeJob).toHaveBeenCalledTimes(1);
      expect(jobScheduler.completeJob).toHaveBeenCalledWith(job, "person.test");

      expect(connection.fireEvent).toHaveBeenCalledTimes(1);
      expect(connection.fireEvent).toHaveBeenCalledWith("task_completed", {
        job,
        person: "person.test",
        task: state.tasks[0],
      });

      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith(
        state.tasks[0]
      );
    });

    it("Should should cancel job", async () => {
      await start(process);

      const [_, listener] = (NotificationManager.prototype.on as any).mock
        .calls[0];

      const job = { id: "jobId" };
      listener("cancel", state.tasks[0], job, "person.test");

      expect(jobScheduler.cancelJob).toHaveBeenCalledTimes(1);
      expect(jobScheduler.cancelJob).toHaveBeenCalledWith(job);

      expect(connection.fireEvent).toHaveBeenCalledTimes(1);
      expect(connection.fireEvent).toHaveBeenCalledWith("task_canceled", {
        job,
        person: "person.test",
        task: state.tasks[0],
      });

      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
      expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith(
        state.tasks[0]
      );
    });
  });

  describe("Process", () => {
    it("Should set up process event if SIGTERM", async () => {
      await start(process);

      expect(process.on).toHaveBeenCalledTimes(1);
      expect(process.on).toHaveBeenCalledWith("SIGTERM", expect.anything());

      const [_, listener] = (process.on as any).mock
        .calls[0];

      listener(new Error("test error"));

      expect(expressApp.close).toHaveBeenCalledTimes(1);
      expect(expressApp.close).toHaveBeenCalledWith()
      expect(process.exit).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
