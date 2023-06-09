import { getTranslator } from "@famcomp/translations";
import API from ".";
import { JobScheduler } from "../Job";
import NotificationManager from "../Notification";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import Logger from "../../logger";
import { AppState } from "../../types";
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { State } from "../../state";
import { isTaskActive } from "@famcomp/common";

jest.mock("../Job");
jest.mock("../Notification");
jest.mock("../../logger");
jest.mock("../../state");
jest.mock("@famcomp/common");
const mockExpress = {
  use: jest.fn(),
  listen: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
  on: jest.fn(),
};
jest.mock("express", () => {
  return {
    __esModule: true,
    default: () => mockExpress,
    json: jest.fn(),
  };
});
jest.mock("helmet");
jest.mock("cors");
jest.mock("@famcomp/home-assistant");
jest.mock("@famcomp/translations");

describe("API", () => {
  const connection = new HomeAssistantConnection("fdsfdsqfs");
  const logger = new Logger();
  const expressApp = express();
  const corsMiddleware = cors();
  const jsonMiddleware = json();
  const helmetMiddleware = helmet();
  const translator = getTranslator("en");
  let state: AppState = {
    tasks: [{ id: "task_id", label: "this is a label" } as any],
    persons: [{ id: "personId" } as any],
  };
  const notification = new NotificationManager(
    connection,
    state,
    translator,
    logger
  );
  const jobScheduler = new JobScheduler(state, logger);
  const close = jest.fn();
  const response = {
    writeHead: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    state = {
      tasks: [{ id: "task_id", label: "this is a label" } as any],
      persons: [{ id: "personId" } as any],
    };

    (helmet as any).mockReturnValue(helmetMiddleware);
    (cors as any).mockReturnValue(corsMiddleware);
    (json as any).mockReturnValue(jsonMiddleware);

    logger.memory = ["test log"];
  });

  it("Should register json, cors and helmet", () => {
    const serverObject = {};
    (expressApp.listen as any).mockReturnValue(serverObject);

    const app = API(state, notification, jobScheduler, logger, close);

    expect(app).toBe(serverObject);
    expect(expressApp.use).toHaveBeenCalledTimes(3);
    expect(expressApp.use).toHaveBeenNthCalledWith(1, helmetMiddleware);
    expect(expressApp.use).toHaveBeenNthCalledWith(2, corsMiddleware);
    expect(expressApp.use).toHaveBeenNthCalledWith(3, jsonMiddleware);
    expect(expressApp.listen).toHaveBeenCalledTimes(1);

    const [port, callback] = (expressApp.listen as any).mock.calls[0];

    expect(port).toBe(7000);

    callback();

    expect(expressApp.get).toHaveBeenCalledTimes(4);
    expect(expressApp.post).toHaveBeenCalledTimes(2);
    expect(expressApp.delete).toHaveBeenCalledTimes(1);
  });

  it("Should register get tasks route", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.get).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.get as any).mock.calls[0];

    listener({}, response);

    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(state.tasks);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should register get persons route", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.get).toHaveBeenNthCalledWith(
      2,
      "/persons",
      expect.anything()
    );
    const [_1, listener] = (expressApp.get as any).mock.calls[1];

    listener({}, response);

    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(state.persons);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should register get logs route", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.get).toHaveBeenNthCalledWith(
      4,
      "/logs",
      expect.anything()
    );
    const [_1, listener] = (expressApp.get as any).mock.calls[3];

    listener({}, response);

    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(logger.memory);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should update task when post existing task", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.post).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.post as any).mock.calls[0];

    listener(
      {
        body: { ...state.tasks[0], newThings: true },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(1);
    expect(State.set).toHaveBeenCalledWith(state);

    expect(state.tasks).toHaveLength(1);

    expect(JobScheduler.prototype.update).toHaveBeenCalledTimes(1);
    expect(JobScheduler.prototype.update).toHaveBeenCalledWith("task_id");
    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith({
      id: "task_id",
      label: "this is a label",
      newThings: true,
    });
    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith({
      ...state.tasks[0],
      newThings: true,
    });
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });
  it("Should create task when post new task", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.post).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.post as any).mock.calls[0];

    listener(
      {
        body: {
          id: "test2",
          label: "this is another label",
        },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(1);
    expect(State.set).toHaveBeenCalledWith(state);

    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[1]).toStrictEqual({
      id: "test2",
      label: "this is another label",
    });

    expect(JobScheduler.prototype.update).toHaveBeenCalledTimes(1);
    expect(JobScheduler.prototype.update).toHaveBeenCalledWith("test2");
    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith({
      id: "test2",
      label: "this is another label",
    });
    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(state.tasks[1]);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should fail create task if it does not have an id or a label", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.post).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.post as any).mock.calls[0];

    listener(
      {
        body: {
          label: "this is another label",
        },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(0);
    expect(state.tasks).toHaveLength(1);
    expect(response.send).toHaveBeenCalledTimes(0);
    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(
      400,
      "Invalid task parameters"
    );
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should delete task when delete existing task", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.delete).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.delete as any).mock.calls[0];

    listener(
      {
        query: { id: "task_id" },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(1);
    expect(State.set).toHaveBeenCalledWith(state);

    expect(state.tasks).toHaveLength(0);

    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledTimes(1);
    expect(NotificationManager.prototype.syncTask).toHaveBeenCalledWith({
      id: "task_id",
      label: "this is a label",
    });
    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(true);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should fail delete task when delete non existing task", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.delete).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.delete as any).mock.calls[0];

    listener(
      {
        query: { id: "task_id2" },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(0);

    expect(state.tasks).toHaveLength(1);

    expect(response.send).toHaveBeenCalledTimes(0);
    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(404, "Task not found");
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should fail delete task when delete non existing task", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];
    callback();

    expect(expressApp.delete).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.delete as any).mock.calls[0];

    listener(
      {
        query: {},
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(0);

    expect(state.tasks).toHaveLength(1);

    expect(response.send).toHaveBeenCalledTimes(0);
    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(400, "Id is required");
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should cancel job when job is active", () => {
    state.tasks[0].jobs = [{ id: "jobId" } as any];
    const expectedTask = { ...state.tasks[0] };
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];

    (isTaskActive as any).mockReturnValue(true);

    callback();

    expect(expressApp.delete).toHaveBeenNthCalledWith(
      1,
      "/tasks",
      expect.anything()
    );
    const [_1, listener] = (expressApp.delete as any).mock.calls[0];

    listener(
      {
        query: { id: expectedTask.id },
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(1);
    expect(State.set).toHaveBeenCalledWith(state);
    expect(state.tasks).toHaveLength(0);

    expect(isTaskActive).toHaveBeenCalledTimes(1);
    expect(isTaskActive).toHaveBeenCalledWith(expectedTask);
    expect(jobScheduler.cancelJob).toHaveBeenCalledTimes(1);
    expect(jobScheduler.cancelJob).toHaveBeenCalledWith(expectedTask.jobs[0]);
    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith(true);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should upload tasks", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];

    callback();

    expect(expressApp.post).toHaveBeenNthCalledWith(
      2,
      "/upload",
      expect.anything()
    );
    const [_1, listener] = (expressApp.post as any).mock.calls[1];

    listener(
      {
        body: [
          {
            id: "test2",
          },
          {
            id: "test3",
          },
        ],
      },
      response
    );

    expect(State.set).toHaveBeenCalledTimes(1);
    expect(State.set).toHaveBeenCalledWith(state);
    expect(state.tasks).toHaveLength(2);

    expect(state.tasks).toStrictEqual([
      {
        id: "test2",
      },
      {
        id: "test3",
      },
    ]);

    expect(
      NotificationManager.prototype.syncNotifications
    ).toHaveBeenCalledTimes(1);
    expect(
      NotificationManager.prototype.syncNotifications
    ).toHaveBeenCalledWith();
    expect(response.writeHead).toHaveBeenCalledTimes(1);
    expect(response.writeHead).toHaveBeenCalledWith(200);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should get stats", () => {
    state.tasks = [
      {
        id: "test",
        jobs: [{ participations: [{ person: "person1" }] }],
      } as any,
      {
        id: "test2",
        jobs: [
          {
            participations: [
              { person: "person1" },
              { person: "person2" },
              { person: "person2" },
            ],
          },
        ],
      } as any,
      { id: "test3", jobs: [{ participations: [] }] } as any,
      { id: "test3" } as any,
    ];
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];

    callback();

    expect(expressApp.get).toHaveBeenNthCalledWith(
      3,
      "/stats",
      expect.anything()
    );
    const [_1, listener] = (expressApp.get as any).mock.calls[2];

    listener({}, response);

    expect(response.send).toHaveBeenCalledTimes(1);
    expect(response.send).toHaveBeenCalledWith({
      person1: {
        test: 1,
        test2: 1,
      },
      person2: {
        test2: 2,
      },
    });
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.end).toHaveBeenCalledWith();
  });

  it("Should call onClose when express app closes", () => {
    API(state, notification, jobScheduler, logger, close);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];

    callback();

    expect(expressApp.on).toHaveBeenNthCalledWith(
      1,
      "close",
      expect.anything()
    );
    const [_1, listener] = (expressApp.on as any).mock.calls[0];

    listener();

    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith();
  });

  it("Should not fail when onClose is undefined", () => {
    API(state, notification, jobScheduler, logger);
    const [_, callback] = (expressApp.listen as any).mock.calls[0];

    callback();

    expect(expressApp.on).toHaveBeenNthCalledWith(
      1,
      "close",
      expect.anything()
    );
    const [_1, listener] = (expressApp.on as any).mock.calls[0];

    listener();

    expect(close).toHaveBeenCalledTimes(0);
  });
});
