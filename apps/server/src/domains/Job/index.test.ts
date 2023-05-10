import * as common from "@famcomp/common";
import { JobScheduler } from ".";
import { AppState } from "../../types";
import dayjs from "dayjs";
import Logger from "../../logger";

type Task = common.Task;

jest.mock("../../logger");
jest.mock("uuid", () => ({ v4: () => "123456789" }));

const createTask = (id = "123"): Task =>
  ({
    id: `test${id}`,
    cron: "0/10 * * *",
    label: "test",
  } as Task);

describe("JobScheduler", () => {
  let setTimeoutSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.UTC(2023, 0, 1, 9, 12, 25, 456));

    setTimeoutSpy = jest
      .spyOn(global, "setTimeout")
      .mockReturnValue("timer" as any);

    clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("Should instanciate JobScheduler", () => {
    const scheduler = new JobScheduler(
      { tasks: [], persons: [] },
      new Logger()
    );

    expect(scheduler).toBeInstanceOf(JobScheduler);
  });

  it("Should start job scheduler", () => {
    const scheduler = new JobScheduler(
      {
        tasks: [createTask(), createTask("234")],
      } as AppState,
      new Logger()
    );

    scheduler.start();

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(
      7 * 60 * 1000 + 34 * 1000 + 544
    );
    // see fake time in before each to calculate this value (7 minutes and 35 seconds in milliseconds)

    expect(scheduler["taskIds"]).toStrictEqual({
      test123: "timer",
      test234: "timer",
    });

    setTimeoutSpy.mockRestore();
  });

  it("Should stop scheduled jobs", () => {
    const scheduler = new JobScheduler(
      {
        tasks: [createTask(), createTask("234")],
      } as AppState,
      new Logger()
    );

    scheduler["taskIds"] = {
      test123: "timer",
      test234: "timer2",
    } as any;

    scheduler.stop();

    expect(scheduler["taskIds"]).toStrictEqual({});
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(clearTimeoutSpy).toHaveBeenNthCalledWith(1, "timer");
    expect(clearTimeoutSpy).toHaveBeenNthCalledWith(2, "timer2");
  });

  it("Should restart scheduled job when updating job", () => {
    const scheduler = new JobScheduler(
      {
        tasks: [createTask(), createTask("234")],
      } as AppState,
      new Logger()
    );

    scheduler["taskIds"] = {
      test123: "timer",
      test234: "timer2",
    } as any;

    setTimeoutSpy.mockReturnValue("timer3");

    scheduler.update("test234");

    expect(scheduler["taskIds"]).toStrictEqual({
      test123: "timer",
      test234: "timer3",
    });
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(clearTimeoutSpy).toHaveBeenCalledWith("timer2");
  });

  it("Should not schedule task when it has no cron", () => {
    const task = createTask();
    task.cron = undefined;

    const scheduler = new JobScheduler(
      { tasks: [{ ...task }] } as AppState,
      new Logger()
    );

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);

    expect(scheduler["state"]["tasks"][0]).toStrictEqual(task);
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });

  it("Should not schedule task when cron is expected to execute in more than a hour", () => {
    const task = createTask();
    task.cron = "0 10 10 *";

    const scheduler = new JobScheduler(
      { tasks: [{ ...task }] } as AppState,
      new Logger()
    );

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);

    expect(Logger.prototype.debug).toHaveBeenCalledTimes(1);
    expect(Logger.prototype.debug).toHaveBeenCalledWith("Skipping", "test123");

    expect(scheduler["state"]["tasks"][0]).toStrictEqual(task);
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });

  it("Should trigger task", () => {
    const task = createTask();
    const scheduler = new JobScheduler(
      { tasks: [{ ...task }] } as AppState,
      new Logger()
    );

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    const taskExecution = setTimeoutSpy.mock.calls[0][0];

    taskExecution();

    expect(scheduler["state"]["tasks"][0]).toStrictEqual({
      ...task,
      jobs: [
        {
          date: dayjs(new Date()),
          id: "123456789",
          participations: [],
        },
      ],
    });
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      scheduler["state"]["tasks"][0],
      scheduler["state"]["tasks"][0]["jobs"]![0]
    );
  });

  it("Should not trigger task when task is already active", () => {
    const task = createTask();
    const scheduler = new JobScheduler(
      { tasks: [{ ...task }] } as AppState,
      new Logger()
    );
    const isTaskActive = jest
      .spyOn(common, "isTaskActive")
      .mockReturnValue(true);

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    const taskExecution = setTimeoutSpy.mock.calls[0][0];

    taskExecution();

    expect(isTaskActive).toHaveBeenCalledTimes(1);
    expect(isTaskActive).toHaveBeenCalledWith(task);
    expect(scheduler["state"]["tasks"][0]).toStrictEqual(task);
    expect(eventSpy).toHaveBeenCalledTimes(0);
  });

  it("Should limit the number of jobs when task has already 100 jobs", () => {
    const task = createTask();
    task.jobs = [];
    for (let i = 0; i < 100; ++i) task.jobs.push({} as any);

    const scheduler = new JobScheduler(
      { tasks: [{ ...task }] } as AppState,
      new Logger()
    );
    const isTaskActive = jest
      .spyOn(common, "isTaskActive")
      .mockReturnValue(false);

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    const taskExecution = setTimeoutSpy.mock.calls[0][0];

    taskExecution();

    expect(isTaskActive).toHaveBeenCalledTimes(1);
    expect(scheduler["state"]["tasks"][0]["jobs"]).toHaveLength(100);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      scheduler["state"]["tasks"][0],
      scheduler["state"]["tasks"][0]["jobs"]![0]
    );
  });

  it("Should complete the job", () => {
    const job: common.Job = {
      date: dayjs(),
      id: "testId",
      participations: [],
    };

    const scheduler = new JobScheduler(
      { tasks: [] as any } as AppState,
      new Logger()
    );

    scheduler.completeJob(job, "test.person");

    expect(job).toStrictEqual({
      date: dayjs(),
      id: "testId",
      participations: [
        {
          description: "",
          person: "test.person",
        },
      ],
      completionDate: dayjs(),
    });
  });

  it("Should complete the job without adding the participation once again", () => {
    const job: common.Job = {
      date: dayjs(),
      id: "testId",
      participations: [
        {
          description: "",
          person: "test.person",
        },
      ],
    };

    const scheduler = new JobScheduler(
      { tasks: [] as any } as AppState,
      new Logger()
    );

    scheduler.completeJob(job, "test.person");

    expect(job).toStrictEqual({
      date: dayjs(),
      id: "testId",
      participations: [
        {
          description: "",
          person: "test.person",
        },
      ],
      completionDate: dayjs(),
    });
  });

  it("Should cancel the job", () => {
    const job: common.Job = {
      date: dayjs(),
      id: "testId",
      participations: [],
    };

    const scheduler = new JobScheduler(
      { tasks: [] as any } as AppState,
      new Logger()
    );

    scheduler.cancelJob(job);

    expect(job).toStrictEqual({
      date: dayjs(),
      id: "testId",
      participations: [],
      completionDate: dayjs(),
    });
  });

  it("Should retrieve right task reference on next call, if state changed externally between executions", () => {
    const task = createTask();
    const state = { tasks: [{ ...task }] } as AppState;
    const scheduler = new JobScheduler(state, new Logger());
    const isTaskActive = jest
      .spyOn(common, "isTaskActive")
      .mockReturnValue(false);

    scheduler.start();

    let taskExecution = setTimeoutSpy.mock.calls[0][0];
    taskExecution();

    let expectedFirstTask = state.tasks[0];

    state.tasks[0] = {
      ...state.tasks[0],
      jobs: [{ ...state.tasks[0].jobs[0], completionDate: "anything" as any }],
    } as Task;

    taskExecution = setTimeoutSpy.mock.calls[1][0];
    taskExecution();

    expect(isTaskActive).toHaveBeenCalledTimes(2);
    expect(isTaskActive).toHaveBeenNthCalledWith(1, expectedFirstTask);
    expect(isTaskActive).toHaveBeenNthCalledWith(2, state.tasks[0]);
  });
});
