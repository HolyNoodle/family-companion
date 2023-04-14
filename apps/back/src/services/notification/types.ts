import { Job, Task, WithId } from "@famcomp/common";

export enum RuntimeEnv {
  Application,
  HomeAssistantAddOn,
}

export interface NotificationProvider {
  start(): Promise<void>;
  createJob(task: Task, job: WithId<Job>): Promise<WithId<Job>>;
  completeJob(task: Task, job: WithId<Job>): Promise<WithId<Job>>;
}
