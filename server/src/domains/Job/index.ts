import EventEmitter from "events";

import parser from "cron-parser";
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

  private startTask(task: WithId<Task>): NodeJS.Timeout {
    console.log("Start task", task.id);
    const nextDate = parser
      .parseExpression(task.cron, {
        startDate: new Date(),
      })
      .next();
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
        date: nextDate.toDate(),
        participations: [],
      };

      task.jobs.splice(0, 0, job);

      this.emit("start_job", task, job);
      this.taskIds[task.id] = this.startTask(task);
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

  const dateGenerator = parser.parseExpression(task.cron, {
    startDate: start,
    endDate: end,
  });

  const dates = [];

  while (dateGenerator.hasNext()) {
    dates.push(dateGenerator.next().toDate());
  }

  return dates;
};
