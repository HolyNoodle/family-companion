import EventEmitter from "events";

import { getFutureMatches } from "@datasert/cronjs-matcher";
import { v4 } from "uuid";
import { Job, Task, WithId } from "../../types";

export class JobScheduler extends EventEmitter {
  private taskIds: { [id: string]: NodeJS.Timeout };
  private schedulerTimer: NodeJS.Timeout | undefined;

  constructor(private tasks: WithId<Task>[]) {
    super();

    this.taskIds = {};
  }

  start() {
    this.taskIds = {};

    this.schedulerTimer = setInterval(this.schedulerProcess, 60 * 60 * 1000);
    this.schedulerProcess();
  }

  schedulerProcess() {
    const idleTasks = this.tasks.filter((t) => !this.taskIds[t.id]);

    idleTasks.forEach(this.startTask.bind(this));
  }

  stop() {
    Object.keys(this.taskIds).forEach(this.stopTask.bind(this));
    clearInterval(this.schedulerTimer);
  }

  update(id: string) {
    this.stopTask(id);
    this.schedulerProcess();
  }

  private stopTask(id: string) {
    const timeout = this.taskIds[id];

    console.log("Clear timeout for task", id);
    clearTimeout(timeout);

    delete this.taskIds[id];
  }

  private startTask(task: WithId<Task>) {
    const endAt = new Date();
    endAt.setHours(endAt.getHours() + 1);
    endAt.setSeconds(endAt.getSeconds() + 1);

    const start = new Date();
    start.setSeconds(start.getSeconds() + 1);
    const nextDateString = getFutureMatches(task.cron, {
      matchCount: 1,
      startAt: start.toISOString(),
      endAt: endAt.toISOString(),
    }).pop();

    if (!nextDateString) {
      console.log("Skipping", task.label, task.cron);
      return undefined;
    }

    const nextDate = new Date(nextDateString);
    nextDate.setSeconds(0);
    nextDate.setMilliseconds(0);
    const now = new Date();

    console.log(
      "Register next job for",
      `"${task.label}"`,
      `(${task.id})`,
      "at",
      nextDate.toISOString()
    );

    const timer = setTimeout(() => {
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

      this.startTask(task);
    }, nextDate.getTime() - now.getTime());

    this.taskIds[task.id] = timer;
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
      startAt: start.toISOString(),
    }).map((d) => {
      const date = new Date(d);
      date.setSeconds(0);
      date.setMilliseconds(0);

      return date;
    });
  } catch {
    return [];
  }
};
