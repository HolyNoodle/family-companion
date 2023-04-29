import { Person, Task, isTaskActive } from "@famcomp/common";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import { ChannelMode, MobileNotificationBuilder } from "@famcomp/notification";
import { AppState } from "../../types";
import { EventEmitter } from "stream";
import { getTranslator } from "@famcomp/translations";

export default class NotificationManager extends EventEmitter {
  constructor(
    private connection: HomeAssistantConnection,
    private state: AppState,
    private translator: ReturnType<typeof getTranslator>,
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

      console.log("State changed for", data.entity_id, "is now:", stateValue);
      this.syncPerson(personObject);
    }
  }

  private cleanUnknownTask(taskId: string, person: string) {
    console.log("Clearing notification for this task for this person");
    const notification = new MobileNotificationBuilder()
      .clear()
      .target(person)
      .tag(taskId);

    return this.connection.send(notification.build());
  }

  private handleNotificationAction(data: {
    action: string;
    tag: string;
    reply_text: string;
  }) {
    const [action, taskId, jobId, personId] = data.action.split(".");
    console.log("received action", action, taskId, jobId, personId);

    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) {
      console.log("Couldn't find task for this action", action);
      this.cleanUnknownTask(taskId, personId);
      return;
    }

    if (action === "trigger") {
      this.emit("action", action, task);

      return;
    }

    const job = task.jobs?.find((j) => j.id === jobId);

    if (!job) {
      console.log("Couldn't find job for this action", action);
      this.cleanUnknownTask(taskId, personId);
      return;
    }

    this.emit("action", action, task, job, "person." + personId);
  }

  private getPersonShortId(person: Person) {
    return person.id.split(".")[1];
  }

  syncPersonTask(person: Person, task: Task): Promise<void> {
    const notification = new MobileNotificationBuilder();
    notification.target(this.getPersonShortId(person)).tag(task.id).clear();

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
              this.getPersonShortId(person),
            ].join("."),
            title: this.translator.translations.notifications.actions.complete,
          })
          .action({
            action: [
              "cancel",
              task.id,
              task.jobs[0].id,
              this.getPersonShortId(person),
            ].join("."),
            title: this.translator.translations.notifications.actions.cancel,
          })
          .channelMode(ChannelMode.Default);

        if (this.notificationUrl) {
          notification.url(this.notificationUrl);
        }
      }
    }

    return this.connection.send(notification.build());
  }

  async syncTask(task: Task) {
    await Promise.all(
      this.state.persons.map((person) => this.syncPersonTask(person, task))
    );
  }

  async syncPerson(person: Person) {
    await Promise.all(
      this.state.tasks.map((task) => this.syncPersonTask(person, task))
    );

    await this.createQuickActionNotificationAction(person);
  }

  createQuickActionNotificationAction(person: Person) {
    const quickTasks = this.state.tasks.filter((t) => t.quickAction);
    const notification = new MobileNotificationBuilder()
      .tag("quick")
      .target(this.getPersonShortId(person));

    if (!person.isHome || quickTasks.length === 0) {
      notification.clear();

      return this.connection.send(notification.build());
    }

    notification
      .title(this.translator.translations.notifications.actions.quick)
      .message("")
      .tag("quick")
      .target(this.getPersonShortId(person))
      .persist(true)
      .stick(true)
      .channelMode(ChannelMode.Action);

    quickTasks.forEach((task) =>
      notification.action({
        action: ["trigger", task.id].join("."),
        title: task.label,
      })
    );

    return this.connection.send(notification.build());
  }

  syncNotifications() {
    console.log("Syncing all tasks notifications");
    return Promise.all(
      this.state.persons.map((person) => this.syncPerson(person))
    );
  }
}
