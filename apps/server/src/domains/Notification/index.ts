import { Person, Task, isTaskActive } from "@famcomp/common";
import {
  HomeAssistantConnection,
  ChannelMode,
  MobileNotificationBuilder,
} from "@famcomp/home-assistant";
import { AppState } from "../../types";
import { EventEmitter } from "stream";
import { getTranslator } from "@famcomp/translations";
import Logger from "../../logger";
import {
  cleanUnknownTask,
  createQuickActionNotificationAction,
  syncPersonTask,
} from "./utils";

export default class NotificationManager extends EventEmitter {
  constructor(
    private connection: HomeAssistantConnection,
    private state: AppState,
    private translator: ReturnType<typeof getTranslator>,
    private logger: Logger,
    private notificationUrl?: string
  ) {
    super();

    connection.subscribeToEvent("state_changed");
    connection.subscribeToEvent("mobile_app_notification_action");

    connection.addListener(
      "state_changed",
      this.handleEntityStateChange.bind(this)
    );
    connection.addListener(
      "mobile_app_notification_action",
      this.handleNotificationAction.bind(this)
    );
  }

  private handleEntityStateChange(data: any) {
    if (!data.entity_id.startsWith("person.")) {
      return;
    }

    const stateValue = data.new_state.state as string;
    const personObject = this.state.persons.find(
      (p) => p.id === data.entity_id
    )!;

    const newIsHome = stateValue.toLocaleLowerCase() === "home";
    if (personObject.isHome !== newIsHome) {
      personObject.isHome = newIsHome;

      this.logger.info(
        "State changed for",
        data.entity_id,
        "is now:",
        stateValue
      );
      this.syncPerson(personObject);
    }
  }

  private handleNotificationAction(data: {
    action: string;
    tag: string;
    reply_text: string;
  }) {
    const [action, taskId, jobId, personId] = data.action.split(".");
    this.logger.info("Received action", action, taskId, personId);

    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) {
      this.logger.warn("Couldn't find task for this action", action);
      cleanUnknownTask(this.connection, taskId, personId, this.logger);
      return;
    }

    if (action === "trigger") {
      this.logger.debug("Emit action", action, "on", taskId, "by quick action");
      this.emit("action", action, task);

      return;
    }

    const job = task.jobs?.find((j) => j.id === jobId);

    if (!job) {
      this.logger.warn(
        "Couldn't find job for this action",
        action,
        "on task",
        taskId
      );
      cleanUnknownTask(this.connection, taskId, personId, this.logger);
      return;
    }

    this.logger.debug("Emit action", action, "on", taskId, "by", personId);
    this.emit("action", action, task, job, "person." + personId);
  }

  async syncTask(task: Task) {
    this.logger.debug("Syncing task", task.id);
    await Promise.all(
      this.state.persons.map((person) =>
        syncPersonTask(
          this.connection,
          person,
          task,
          this.logger,
          this.translator,
          this.notificationUrl
        )
      )
    );

    await Promise.all(
      this.state.persons.map((person) =>
        createQuickActionNotificationAction(
          this.connection,
          person,
          this.state.tasks,
          this.logger,
          this.translator
        )
      )
    );
  }

  async syncPerson(person: Person) {
    this.logger.debug("Syncing person", person.id);
    await Promise.all(
      this.state.tasks.map((task) =>
        syncPersonTask(
          this.connection,
          person,
          task,
          this.logger,
          this.translator,
          this.notificationUrl
        )
      )
    );

    await createQuickActionNotificationAction(
      this.connection,
      person,
      this.state.tasks,
      this.logger,
      this.translator
    );
  }

  syncNotifications() {
    this.logger.info("Syncing all tasks notifications");
    return Promise.all(
      this.state.persons.map((person) => this.syncPerson(person))
    );
  }
}
