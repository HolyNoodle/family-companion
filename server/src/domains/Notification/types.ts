import { Job, Task, WithId } from "../../types";

export interface NotificationProvider {
  createJob(task: Task, job: WithId<Job>): Promise<void>;
  completeJob(task: Task, job: WithId<Job>): Promise<void>;
}
