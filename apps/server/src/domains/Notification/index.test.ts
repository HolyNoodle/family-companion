import { HomeAssistantConnection } from "@famcomp/home-assistant";
import NotificationManager from ".";
import { AppState } from "../../types";
import { getTranslator } from "@famcomp/translations";
import Logger from "../../logger";
import dayjs from "dayjs";

import {
  cleanUnknownTask,
  createQuickActionNotificationAction,
  syncPersonTask,
} from "./utils";

jest.mock("@famcomp/common");
jest.mock("@famcomp/home-assistant");
jest.mock("../../logger");
jest.mock("./utils");

describe("NotificationManager", () => {
  const connection = new HomeAssistantConnection("token234");
  let state: AppState = {
    tasks: [],
    persons: [],
  };
  const translator = getTranslator("en");
  const logger = new Logger();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    state = {
      tasks: [
        {
          id: "test_task",
          label: "This is a label",
          description: "This is a description",
          startDate: dayjs(),
          jobs: [{ id: "jobId", date: dayjs(), participations: [] }],
          active: true,
        },
      ],
      persons: [
        {
          id: "person.test",
          internalId: "AZERTY",
          isHome: false,
          name: "Test",
        },
      ],
    };
  });
  it("Should instanciate the manager", () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger
    );

    expect(manager).toBeInstanceOf(NotificationManager);
    expect(connection.subscribeToEvent).toHaveBeenCalledTimes(2);
    expect(connection.subscribeToEvent).toHaveBeenNthCalledWith(
      1,
      "state_changed"
    );
    expect(connection.subscribeToEvent).toHaveBeenNthCalledWith(
      2,
      "mobile_app_notification_action"
    );
    expect(connection.on).toHaveBeenCalledTimes(2);
    expect((connection.on as any as jest.SpyInstance).mock.calls[0][0]).toBe(
      "state_changed"
    );
    expect((connection.on as any as jest.SpyInstance).mock.calls[1][0]).toBe(
      "mobile_app_notification_action"
    );
  });

  it("Should trigger entity state change and sync person task", async () => {
    new NotificationManager(connection, state, translator, logger);

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "person.test",
      new_state: {
        state: "Home",
      },
    });

    await jest.advanceTimersToNextTimerAsync();

    expect(syncPersonTask).toHaveBeenCalledTimes(1);
    expect(syncPersonTask).toHaveBeenCalledWith(
      connection,
      state.persons[0],
      state.tasks[0],
      logger,
      translator,
      undefined
    );

    expect(createQuickActionNotificationAction).toHaveBeenCalledTimes(1);
    expect(createQuickActionNotificationAction).toHaveBeenCalledWith(
      connection,
      state.persons[0],
      state.tasks,
      logger,
      translator
    );
  });

  it("Should trigger entity state change and sync person task with notification url", async () => {
    new NotificationManager(connection, state, translator, logger, "test/url");

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "person.test",
      new_state: {
        state: "Home",
      },
    });

    await jest.advanceTimersToNextTimerAsync();

    expect(syncPersonTask).toHaveBeenCalledTimes(1);
    expect(syncPersonTask).toHaveBeenCalledWith(
      connection,
      state.persons[0],
      state.tasks[0],
      logger,
      translator,
      "test/url"
    );

    expect(createQuickActionNotificationAction).toHaveBeenCalledTimes(1);
    expect(createQuickActionNotificationAction).toHaveBeenCalledWith(
      connection,
      state.persons[0],
      state.tasks,
      logger,
      translator
    );
  });

  it("Should ignore when updated entity is not a person", () => {
    new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    (connection.on as any as jest.SpyInstance).mock.calls[0][1]({
      entity_id: "other.test",
      new_state: {
        state: "Home",
      },
    });

    expect(HomeAssistantConnection.prototype.send).toHaveBeenCalledTimes(0);
  });

  it("Should sync all persons and tasks", async () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [],
      active: true,
    });

    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    await manager.syncNotifications();

    expect(syncPersonTask).toHaveBeenCalledTimes(4);

    expect(createQuickActionNotificationAction).toHaveBeenCalledTimes(2);
  });

  it("Should sync one task for everyone", async () => {
    state.persons.push({
      id: "person.test",
      internalId: "AZERTY",
      isHome: false,
      name: "Test",
    });
    state.tasks.push({
      id: "test_task",
      label: "This is a label",
      startDate: dayjs(),
      jobs: [],
      active: true,
    });

    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    await manager.syncTask(state.tasks[0]);

    expect(syncPersonTask).toHaveBeenCalledTimes(2);
    expect(createQuickActionNotificationAction).toHaveBeenCalledTimes(2);
  });

  it("Should trigger task action complete", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "complete.test_task.jobId.personId",
    });

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      "complete",
      state.tasks[0],
      state.tasks[0].jobs[0],
      "person.personId"
    );
  });

  it("Should trigger task action cancel", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "complete.test_task.jobId.personId",
    });

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      "complete",
      state.tasks[0],
      state.tasks[0].jobs[0],
      "person.personId"
    );
  });

  it("Should not trigger task action and try clearing it for person when task is unknown", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "complete.test_task1.jobId.personId",
    });

    expect(eventSpy).toHaveBeenCalledTimes(0);
    expect(cleanUnknownTask).toHaveBeenCalledTimes(1);
    expect(cleanUnknownTask).toHaveBeenCalledWith(
      connection,
      "test_task1",
      "personId",
      logger
    );
  });

  it("Should not trigger task action and try clearing it for person when job is unknown", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "complete.test_task.jobId1.personId",
    });

    expect(eventSpy).toHaveBeenCalledTimes(0);
    expect(cleanUnknownTask).toHaveBeenCalledTimes(1);
    expect(cleanUnknownTask).toHaveBeenCalledWith(
      connection,
      "test_task",
      "personId",
      logger
    );
  });

  it("Should not trigger task action and try clearing it for person when task has no jobs", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    state.tasks[0].jobs = undefined as any;

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "complete.test_task.jobId.personId",
    });

    expect(eventSpy).toHaveBeenCalledTimes(0);
    expect(cleanUnknownTask).toHaveBeenCalledTimes(1);
    expect(cleanUnknownTask).toHaveBeenCalledWith(
      connection,
      "test_task",
      "personId",
      logger
    );
  });

  it("Should trigger task action with only the task when action is 'trigger'", async () => {
    const manager = new NotificationManager(
      connection,
      state,
      translator,
      logger,
      "/notificationUrl/path"
    );

    const eventSpy = jest.fn();
    manager.on("action", eventSpy);

    (connection.on as any as jest.SpyInstance).mock.calls[1][1]({
      action: "trigger.test_task",
    });

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith("trigger", state.tasks[0]);
  });
});
