import EventEmitter from "events";
import { Job, Task, WithId } from "../types";

import parser from "cron-parser";
import { v4 } from "uuid";

export class JobScheduler extends EventEmitter {
    private taskIds: { [id: string]: NodeJS.Timeout } | undefined;

    constructor(private tasks: WithId<Task>[]) {
        super();
    }

    start() {
        this.taskIds = this.tasks.reduce((ids, task) => {
            return {
                ...ids,
                [task.id]: this.startTask(task)
            }
        }, {});
    }

    stop() {
        this.taskIds && Object.values(this.taskIds).forEach((timeout) => {
            clearTimeout(timeout);
        })
    }

    private startTask(task: WithId<Task>): NodeJS.Timeout {
        const nextDate = parser.parseExpression(task.cron, {
            startDate: task.jobs?.[0].date || task.startDate || new Date()
        }).next();
        const now = new Date();

        console.log("Register next job for", `"${task.label}"`, `(${task.id})`, "at", nextDate.toISOString())

        return setTimeout(() => {
            console.log("Job triggered for", `"${task.label}"`, `(${task.id})`)
            if (!task.jobs) {
                task.jobs = [];
            }

            const job: WithId<Job> = {
                id: v4(),
                date: nextDate.toDate(),
                participations: []
            };

            task.jobs.splice(0, 0, job);

            this.emit("start_job", task, job);

            this.startTask(task);
        }, nextDate.getTime() - now.getTime());
    }
}