import { Job, Task } from "@famcomp/common";

export interface NotificationProvider {
  sendNnotification(task: Task, job: Job): Promise<void>;
  completeJob(task: Task, job: Job): Promise<void>;
}
