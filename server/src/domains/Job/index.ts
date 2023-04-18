import EventEmitter from "events";

import { getFutureMatches } from "@datasert/cronjs-matcher";
import { v4 } from "uuid";
import { Job, Task, WithId } from "../../types";

export class JobScheduler extends EventEmitter {
  private taskIds: { [id: string]: NodeJS.Timeout };

  constructor(private tasks: WithId<Task>[]) {
    super();

    this.taskIds = {};
  }

  start() {
    this.taskIds = this.tasks.reduce((ids, task) => {
      try {
        return {
          ...ids,
          [task.id]: this.startTask(task),
        };
      } catch {
        return ids;
      }
    }, {});
  }

  stop() {
    Object.entries(this.taskIds).forEach((entry) => {
      const [id, timeout] = entry;

      console.log("Clear timeout for task", id);
      clearTimeout(timeout);
    });

    this.taskIds = {};
  }

  private startTask(task: WithId<Task>): NodeJS.Timeout | undefined {
    const nextDateString = getFutureMatches(task.cron, { matchCount: 1 }).pop();

    if (!nextDateString) {
      return undefined;
    }

    const nextDate = new Date(nextDateString);
    const now = new Date();

    console.log(
      "Register next job for",
      `"${task.label}"`,
      `(${task.id})`,
      "at",
      nextDate.toISOString()
    );

    return setTimeout(() => {
      console.log("Job triggered for", `"${task.label}"`, `(${task.id})`);
      if (!task.jobs) {
        task.jobs = [];
      }

      const job: WithId<Job> = {
        id: v4(),
        date: nextDate,
        participations: [],
      };

      task.jobs.splice(0, 0, job);

      this.emit("start_job", task, job);

      const timer = this.startTask(task);

      if (timer) this.taskIds[task.id] = timer;
    }, nextDate.getTime() - now.getTime());
  }
}

export const getExecutionDates = (
  task: Task,
  start: Date,
  end: Date
): Date[] => {
  if (!start || !end) {
    return [];
  }

  try {
    return getFutureMatches(task.cron, {
      matchCount: 100,
      endAt: end.toISOString(),
      startAt: new Date(start.getTime() - 1).toISOString(),
    }).map((d) => new Date(d));
  } catch {
    return [];
  }
};
