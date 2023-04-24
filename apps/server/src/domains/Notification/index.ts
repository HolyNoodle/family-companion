import { Job, Person, Task } from "@famcomp/common";
import { NotificationProvider } from "./types";
import {
  HomeAssistantConnection,
  HomeAssistantMessage,
} from "@famcomp/home-assistant";

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
  target: Required<Person>,
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
        tag: target.id,
        actions: withAction
          ? [
              {
                action: "URI",
                title: "Terminer",
                uri: `http://192.168.1.34:8099/api/tasks/action?action=COMPLETE&taskId=${taskId}&jobId=${jobId}&person=${target.id}`,
              },
              {
                action: "URI",
                title: "Annuler",
                uri: `http://192.168.1.34:8099/api/tasks/action?action=CANCEL&taskId=${taskId}&jobId=${jobId}&person=${target.id}`,
              },
            ]
          : undefined,
      },
    },
  };
};

export class HomeAssistantNotificationProvider implements NotificationProvider {
  constructor(private haConnection: HomeAssistantConnection, private persons: Person[]) {}

  async createJob(task: Task, job: Job): Promise<any> {
    const promises = this.persons
      .filter((person) => person.id === "person.kevin")
      .map((person) => {
        const notification = createNotificationMessage(
          task.id,
          job.id,
          person as Required<Person>,
          {
            title: task.label,
            message: task.description || "",
          }
        );

        return this.haConnection.send(notification);
      });

    return Promise.all(promises);
  }

  async completeJob(task: Task, job: Job): Promise<any> {
    const promises = this.persons.map((person) => {
      const notification = createNotificationMessage(
        task.id,
        job.id,
        person as Required<Person>,
        {
          message: "clear_notification",
        },
        false
      );

      console.log("Sending notification", notification);

      return this.haConnection.send(notification);
    });

    return Promise.all(promises);
  }
}
