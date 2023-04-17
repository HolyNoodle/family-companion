import { JobScheduler, getExecutionDates } from ".";
import { Task, WithId } from "../../types";

jest.mock("uuid", () => ({ v4: () => "123456789" }));

const createTask = (id = "123"): WithId<Task> =>
  ({
    id: `test${id}`,
    cron: "*/10 * * * * *",
    label: "test",
  } as WithId<Task>);

describe("getExecutionDates", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.UTC(2023, 0, 1, 9, 12, 25, 345));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("Should return empty array when endDate is equal to startDate", () => {
    const startDate = new Date();
    const endDate = new Date();

    endDate.setSeconds(startDate.getSeconds() + 30);
    const result = getExecutionDates(createTask(), startDate, startDate);

    expect(result).toHaveLength(0);
  });

  it("Should return empty array when endDate is undefined", () => {
    const startDate = new Date();

    const result = getExecutionDates(
      createTask(),
      startDate,
      undefined as any as Date
    );

    expect(result).toHaveLength(0);
  });

  it("Should return empty array when startDate is undefined", () => {
    const startDate = new Date();

    const result = getExecutionDates(
      createTask(),
      undefined as any as Date,
      startDate
    );

    expect(result).toHaveLength(0);
  });

  it("Should return 3 dates over 30 seconds", () => {
    const startDate = new Date();
    const endDate = new Date();

    endDate.setSeconds(startDate.getSeconds() + 30);
    const result = getExecutionDates(createTask(), startDate, endDate);

    expect(result).toHaveLength(3);
    expect(result.map((d) => d.toISOString())).toStrictEqual([
      "2023-01-01T09:12:30.000Z",
      "2023-01-01T09:12:40.000Z",
      "2023-01-01T09:12:50.000Z",
    ]);
  });
});

describe("JobScheduler", () => {
  let setTimeoutSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.UTC(2023, 0, 1, 9, 12, 25, 345));

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
    const scheduler = new JobScheduler([]);

    expect(scheduler).toBeInstanceOf(JobScheduler);
  });

  it("Should start job scheduler", () => {
    const scheduler = new JobScheduler([createTask(), createTask("234")]);

    scheduler.start();

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(4655); // see fake time in before each to calculate this value (30 seconds - 25 seconds and 345 ms)

    expect(scheduler["taskIds"]).toStrictEqual({
      test123: "timer",
      test234: "timer",
    });

    setTimeoutSpy.mockRestore();
  });

  it("Should stop scheduled jobs", () => {
    const scheduler = new JobScheduler([createTask(), createTask("234")]);

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
    const scheduler = new JobScheduler([{ ...task }]);

    scheduler.start();

    const eventSpy = jest.fn();
    scheduler.addListener("start_job", eventSpy);

    const taskExecution = setTimeoutSpy.mock.calls[0][0];

    taskExecution();

    expect(scheduler["tasks"][0]).toStrictEqual({
      ...task,
      jobs: [
        {
          date: new Date("2023-01-01T09:12:30.000Z"),
          id: "123456789",
          participations: [],
        },
      ],
    });
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith(
      scheduler["tasks"][0],
      scheduler["tasks"][0]["jobs"]![0]
    );
  });
});
