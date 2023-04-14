import { Job, Task, WithId } from "@famcomp/common";
import { NotificationProvider } from "./types";

export class HomeAssistantNotificationProvider implements NotificationProvider {
  constructor(private token: string) {}
  async start() {}
  async createJob(task: Task, job: WithId<Job>): Promise<WithId<Job>> {
    return {} as any;
  }
  async completeJob(task: Task, job: WithId<Job>): Promise<WithId<Job>> {
    return {} as any;
  }
}
