import { Job, Task, WithId } from "../types";

export class NotificationService {
  public async start() {
  }
  public async createJob(task: Task, job: WithId<Job>) {
    console.log("Create notification", task.label, " at ", job.date);
  }
  public async completeJob(task: Task, job: WithId<Job>) {
    console.log("Dismiss notification", task.label, " at ", job.date);
  }
}