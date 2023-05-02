import dayjs from "dayjs";
import { Job, Task, isJobActive, isTaskActive } from ".";

describe("isTaskActive", () => {
  const defaultTask: Task = {
    active: true,
    id: "id",
    label: "label",
    startDate: dayjs(),
    jobs: [],
  };

  it("Should return false when task has no active job", () => {
    expect(
      isTaskActive({
        ...defaultTask,
        jobs: [
          {
            id: "id",
            date: dayjs(),
            completionDate: dayjs(),
            participations: [],
          },
        ],
      })
    ).toBeFalsy();
  });

  it("Should return false when task has no jobs", () => {
    expect(
      isTaskActive({
        ...defaultTask,
        jobs: [],
      })
    ).toBeFalsy();
  });

  it("Should return false when task has undefined jobs", () => {
    expect(
      isTaskActive({
        ...defaultTask,
        jobs: undefined as any,
      })
    ).toBeFalsy();
  });

  it("Should return true when task has active job", () => {
    expect(
      isTaskActive({
        ...defaultTask,
        jobs: [
          {
            id: "id",
            date: dayjs(),
            participations: [],
          },
        ],
      })
    ).toBeTruthy();
  });
});

describe("isJobActive", () => {
  const defaultJob: Job = {
    id: "id",
    date: dayjs(),
    participations: [],
  };
  const defaultTask: Task = {
    active: true,
    id: "id",
    label: "label",
    startDate: dayjs(),
    jobs: [defaultJob],
  };

  it("Should return true when job has no completion date", () => {
    expect(isJobActive(defaultTask, defaultJob)).toBeTruthy();
  });

  it("Should return false when job has completion date", () => {
    const job = { ...defaultJob, completionDate: dayjs() };
    expect(isJobActive({ ...defaultTask, jobs: [job] }, job)).toBeFalsy();
  });

  it("Should return false when job is not first in the tasks", () => {
    expect(
      isJobActive(
        { ...defaultTask, jobs: [{} as any, defaultJob] },
        { ...defaultJob }
      )
    ).toBeFalsy();
  });

  it("Should return false when task is not active", () => {
    expect(
      isJobActive({ ...defaultTask, jobs: [] }, { ...defaultJob })
    ).toBeFalsy();
  });
});
