import { Person, Task, isTaskActive } from "@famcomp/common";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import { MobileNotificationBuilder } from "@famcomp/notification";
import { AppState } from "../../types";
import { EventEmitter } from "stream";
import { v4 } from "uuid";
import dayjs from "dayjs";

export default class NotificationManager extends EventEmitter {
  constructor(
    private connection: HomeAssistantConnection,
    private state: AppState
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
    personObject.isHome = stateValue.toLocaleLowerCase() === "home";

    console.log("State changed for", data.entity_id, "is now:", stateValue);

    this.syncPerson(personObject);
  }

  private handleNotificationAction(data: {
    action: string;
    tag: string;
    reply_text: string;
  }) {
    if (data.action === "REPLY") {
      if (data.tag === "task.action.todo") {
        this.emit("new_task", {
          id: v4(),
          jobs: [],
          label: data.reply_text,
          startDate: dayjs(),
          active: true,
        } as Task);
      }
      return;
    }

    const [action, taskId, jobId, person] = data.action.split(".");
    console.log("received action", action, taskId, jobId, person);

    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      console.log("Couldn't find task for this action", action);
      return;
    }

    const job = task.jobs?.find((j) => j.id === jobId);

    if (!job) {
      console.log("Couldn't find job for this action", action);
      console.log("Clearing notification for this job for this person");
      const notification = new MobileNotificationBuilder()
        .clear()
        .target(person.split(".")[1])
        .tag(task.id);

      this.connection.send(notification.build());
      return;
    }

    this.emit("action", action, task, job, "person." + person);
  }

  private getPersonShortId(person: Person) {
    return person.id.split('.')[1];
  }

  syncPersonTask(person: Person, task: Task): Promise<void> {
    const notification = new MobileNotificationBuilder();
    notification.target(person.id.split(".")[1]).tag(task.id).clear();

    if (isTaskActive(task)) {
      if (person.isHome) {
        notification
          .title(task.label)
          .message(task.description || "")
          .persist(true)
          .stick(true)
          .action({
            action: ["complete", task.id, task.jobs[0].id, this.getPersonShortId(person)].join("."),
            title: "Terminer",
          })
          .action({
            action: ["cancel", task.id, task.jobs[0].id, this.getPersonShortId(person)].join("."),
            title: "Annuler",
          })
          .important();
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

    await this.createNotificationAction(person);
  }

  createNotificationAction(person: Person) {
    const notification = new MobileNotificationBuilder()
      .title("Créer une tâche")
      .message("")
      .tag("task.action.todo")
      .target(this.getPersonShortId(person))
      .persist(true)
      .stick(true)
      .action({
        action: "REPLY",
        title: "TODO",
      })
      .notImportant();

    this.connection.send(notification.build());
  }

  syncNotifications() {
    console.log("Syncing all tasks notifications");
    return Promise.all(
      this.state.persons
        .map((person) => this.syncPerson(person))
    );
  }
}
