import { Person, Task, isTaskActive } from "@famcomp/common";
import {
  ChannelMode,
  HomeAssistantConnection,
  MobileNotificationBuilder,
} from "@famcomp/home-assistant";
import Logger from "../../logger";
import { getTranslator } from "@famcomp/translations";

export const getPersonShortId = (person: Person) => {
  return person.id.split(".")[1];
};

export const syncPersonTask = (
  connection: HomeAssistantConnection,
  person: Person,
  task: Task,
  logger: Logger,
  translator: ReturnType<typeof getTranslator>,
  notificationUrl?: string
): Promise<void> => {
  logger.debug("Syncing task", task.id, "for person", person.id);
  const notification = new MobileNotificationBuilder();
  notification.target(getPersonShortId(person)).tag(task.id).clear();

  if (isTaskActive(task)) {
    if (person.isHome) {
      notification
        .title(task.label)
        .message(task.description || "")
        .persist(true)
        .stick(true)
        .action({
          action: [
            "complete",
            task.id,
            task.jobs[0].id,
            getPersonShortId(person),
          ].join("."),
          title: translator.translations.notifications.actions.complete,
        })
        .action({
          action: [
            "cancel",
            task.id,
            task.jobs[0].id,
            getPersonShortId(person),
          ].join("."),
          title: translator.translations.notifications.actions.cancel,
        })
        .channelMode(ChannelMode.Default);

      if (notificationUrl) {
        notification.url(notificationUrl);
      }
    }
  }

  return connection.send(notification.build());
};

export const createQuickActionNotificationAction = (
  connection: HomeAssistantConnection,
  person: Person,
  tasks: Task[],
  logger: Logger,
  translator: ReturnType<typeof getTranslator>
) => {
  logger.debug("Syncing quick action notification");
  const quickTasks = tasks.filter((t) => !!t.quickAction);
  const notification = new MobileNotificationBuilder()
    .tag("quick")
    .target(getPersonShortId(person));

  if (!person.isHome || quickTasks.length === 0) {
    notification.clear();

    logger.debug("Clearing quick notification for", person.id);
    return connection.send(notification.build());
  }

  notification
    .title(translator.translations.notifications.actions.quick)
    .message("")
    .persist(true)
    .stick(true)
    .channelMode(ChannelMode.Action);

  quickTasks.forEach((task) =>
    notification.action({
      action: ["trigger", task.id].join("."),
      title: task.label,
    })
  );

  logger.debug("Creating quick notification for", person.id);
  return connection.send(notification.build());
};

export const cleanUnknownTask = (
  connection: HomeAssistantConnection,
  taskId: string,
  person: string,
  logger: Logger
) => {
  logger.info("Clearing notification for this task for this person");
  const notification = new MobileNotificationBuilder()
    .clear()
    .target(person)
    .tag(taskId);

  return connection.send(notification.build());
};
