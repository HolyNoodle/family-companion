import { Job, Task } from "@famcomp/common";

export interface NotificationProvider {
  createJob(task: Task, job: Job): Promise<void>;
  completeJob(task: Task, job: Job): Promise<void>;
}
