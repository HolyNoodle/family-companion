import { Job, Person, Task } from "@famcomp/common";
import {
  HomeAssistantConnection,
  HomeAssistantMessage,
} from "@famcomp/home-assistant";

export type NotificationAction =
  | {
      action: "URI";
      title: string;
      uri: string;
    }
  | { action: string; title: string };

export type NotificationInfo =
  | {
      message: string;
      title: string;
      data?: {
        persistent?: boolean;
        sticky?: boolean;
        tag?: string;
        actions?: NotificationAction[];
      };
    }
  | {
      message: "clear_notification";
    };

const createNotificationMessage = (
  taskId: string,
  jobId: string,
  target: Person,
  notification: NotificationInfo,
  withAction: boolean = true
): HomeAssistantMessage<NotificationInfo> => {
  return {
    type: "call_service",
    domain: "notify",
    service: "mobile_app_" + target.id.split(".")[1],
    service_data: {
      ...notification,
      data: {
        persistent: true,
        sticky: true as any,
        tag: taskId,
        actions: withAction
          ? [
              {
                action: ["complete", taskId, jobId, target.id].join("#"),
                title: "Terminer",
              },
              {
                action: ["cancel", taskId, jobId, target.id].join("#"),
                title: "Annuler",
              },
            ]
          : undefined,
      },
    },
  };
};

export class HomeAssistantNotificationProvider {
  constructor(private haConnection: HomeAssistantConnection) {}

  async sendNotification(person: Person, task: Task, job: Job): Promise<any> {
    const notification = createNotificationMessage(task.id, job.id, person, {
      title: task.label,
      message: task.description || "",
    });

    console.log("Send notification for", person.id, "- task", task.id);
    return this.haConnection.send(notification);
  }

  async clearNotification(person: Person, task: Task, job: Job): Promise<any> {
    const notification = createNotificationMessage(
      task.id,
      job.id,
      person,
      {
        message: "clear_notification",
      },
      false
    );

    console.log("Clear notification for", person.id, "- task:", task.id);
    return this.haConnection.send(notification);
  }
}
