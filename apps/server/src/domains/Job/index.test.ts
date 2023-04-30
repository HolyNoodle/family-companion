import { Task } from "@famcomp/common";
import { JobScheduler } from ".";
import { AppState } from "../../types";
import dayjs from "dayjs";
import Logger from "../../logger";

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
    const scheduler = new JobScheduler({ tasks: [], persons: [] }, new Logger());

    expect(scheduler).toBeInstanceOf(JobScheduler);
  });

  it("Should start job scheduler", () => {
    const scheduler = new JobScheduler({
      tasks: [createTask(), createTask("234")],
    } as AppState, new Logger());

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
    const scheduler = new JobScheduler({
      tasks: [createTask(), createTask("234")],
    } as AppState, new Logger());

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

  it("Should trigger task", () => {
    const task = createTask();
    const scheduler = new JobScheduler({ tasks: [{ ...task }] } as AppState, new Logger());

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
});
