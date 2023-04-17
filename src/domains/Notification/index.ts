import { Job, Task, WithId } from "../../types";
import { NotificationProvider } from "./types";
import {
  HomeAssistantConnection,
  HomeAssistantMessage,
} from "../../connection";

export type NotificationInfo =
  | {
      message: string;
      title: string;
      data?: {
        tag?: string;
      };
    }
  | {
      message: "clear_notification";
    };

const createNotificationMessage = (
  jobId: string,
  notification: NotificationInfo
): HomeAssistantMessage<NotificationInfo> => {
  return {
    type: "call_service",
    domain: "notification",
    service: "notify.ALL_DEVICES",
    service_data: {
      ...notification,
      data: {
        tag: jobId,
      },
    },
  };
};

export class HomeAssistantNotificationProvider implements NotificationProvider {
  constructor(private haConnection: HomeAssistantConnection) {}

  async createJob(task: Task, job: WithId<Job>): Promise<any> {
    const notification = createNotificationMessage(job.id, {
      title: task.label,
      message: task.description || "",
    });

    return this.haConnection.send(notification);
  }

  async completeJob(_: Task, job: WithId<Job>): Promise<any> {
    const notification = createNotificationMessage(job.id, {
      message: "clear_notification",
    });

    return this.haConnection.send(notification);
  }
}
