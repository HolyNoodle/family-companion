import EventEmitter from "events";

import { getFutureMatches } from "@datasert/cronjs-matcher";
import { v4 } from "uuid";
import { Job, Task, isTaskActive } from "@famcomp/common";
import dayjs from "dayjs";
import { AppState } from "../../types";
import Logger from "../../logger";

export class JobScheduler extends EventEmitter {
  private taskIds: { [id: string]: NodeJS.Timeout };
  private schedulerTimer: NodeJS.Timeout | undefined;

  constructor(private state: AppState, private logger: Logger) {
    super();

    this.taskIds = {};
  }

  start() {
    this.taskIds = {};

    this.schedulerTimer = setInterval(
      this.schedulerProcess.bind(this),
      30 * 60 * 1000
    );
    this.schedulerProcess();
  }

  schedulerProcess() {
    const idleTasks = this.state.tasks.filter((t) => !this.taskIds[t.id]);

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

    if (timeout) {
      this.logger.info("Clear timeout for task", id);
      clearTimeout(timeout);

      delete this.taskIds[id];
    }
  }

  private startTask(task: Task) {
    if (!task.cron) {
      return;
    }

    const endAt = new Date();
    endAt.setHours(endAt.getHours() + 1);
    endAt.setSeconds(endAt.getSeconds() + 1);

    const start = new Date();
    start.setSeconds(start.getSeconds() - 1);
    const nextDateString = getFutureMatches(task.cron, {
      matchCount: 1,
      startAt: start.toISOString(),
      endAt: endAt.toISOString(),
    }).pop();

    if (!nextDateString) {
      this.logger.debug("Skipping", task.id);
      return;
    }

    const nextDate = new Date(nextDateString);
    nextDate.setSeconds(0);
    nextDate.setMilliseconds(0);
    const now = new Date();

    this.logger.debug(
      "Register next job for",
      task.id,
      "at",
      nextDate.toISOString()
    );

    this.taskIds[task.id] = setTimeout(() => {
      this.logger.debug("Trigger next job for", task.id);
      delete this.taskIds[task.id];
      const currentTask = this.state.tasks.find((t) => t.id === task.id);

      if (!currentTask) {
        this.logger.debug("Task not found", task.id);
        return;
      }

      if(this.triggerTask(currentTask)) {
        this.startTask(currentTask);
      }
    }, nextDate.getTime() - now.getTime());
  }

  triggerTask(task: Task) {
    if (isTaskActive(task)) {
      this.logger.debug(
        "Task",
        task.id,
        "already active, skipping trigger. Details:",
        JSON.stringify({ ...task, job: task.jobs?.slice(0, 3) })
      );

      return undefined;
    }

    if (!task.jobs) {
      task.jobs = [];
    }

    const job: Job = {
      id: v4(),
      date: dayjs(),
      participations: [],
    };

    if (task.jobs.unshift(job) > 100) {
      this.logger.debug("Limit size of jobs to", 100, "for task");
      task.jobs = task.jobs.slice(0, 100);
    }

    this.logger.info("Job started for", task.id);
    this.emit("start_job", task, job);

    return job;
  }

  completeJob(job: Job, person: string) {
    job.completionDate = dayjs();

    if (
      !job.participations.some(
        (participation) => participation.person === person
      )
    ) {
      job.participations.push({
        description: "",
        person: person as string,
      });
    }
  }

  cancelJob(job: Job) {
    job.completionDate = dayjs();
  }
}
