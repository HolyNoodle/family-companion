import { Job, Task, WithId } from "../../types";
import { NotificationProvider } from "./types";
import {
  HomeAssistantConnection,
  HomeAssistantMessage,
} from "../../connection";

export interface NotificationAction {
  action: "URI";
  title: string;
  uri: string;
}

export type NotificationInfo =
  | {
      message: string;
      title: string;
      data?: {
        tag?: string;
        actions: NotificationAction[]
      };
    }
  | {
      message: "clear_notification";
    };

const createNotificationMessage = (
  taskId: string,
  jobId: string,
  notification: NotificationInfo
): HomeAssistantMessage<NotificationInfo> => {
  return {
    type: "call_service",
    domain: "notify",
    service: "mobile_app_one_10",
    service_data: {
      ...notification,
      data: {
        tag: jobId,
        actions: [
          {
            action: "URI",
            title: "Terminer",
            uri: `http://192.168.1.34:7000/tasks/action?action=COMPLETE&taskId=${taskId}&jobId=${jobId}`
          },
          {
            action: "URI",
            title: "Annuler",
            uri: `http://192.168.1.34:7000/tasks/action?action=CANCEL&taskId=${taskId}&jobId=${jobId}`
          }
        ]
      },
    },
  };
};

export class HomeAssistantNotificationProvider implements NotificationProvider {
  constructor(private haConnection: HomeAssistantConnection) {}

  async createJob(task: WithId<Task>, job: WithId<Job>): Promise<any> {
    const notification = createNotificationMessage(task.id, job.id, {
      title: task.label,
      message: task.description || "",
    });

    return this.haConnection.send(notification);
  }

  async completeJob(task: WithId<Task>, job: WithId<Job>): Promise<any> {
    const notification = createNotificationMessage(task.id, job.id, {
      message: "clear_notification",
    });

    return this.haConnection.send(notification);
  }
}
