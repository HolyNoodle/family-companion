import { Job, Person, Task, isTaskActive } from "@famcomp/common";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import { HomeAssistantNotificationProvider } from "@famcomp/notification";
import { AppState } from "../../types";
import { EventEmitter } from "stream";

export default class NotificationManager extends EventEmitter {
  constructor(
    private provider: HomeAssistantNotificationProvider,
    connection: HomeAssistantConnection,
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

  private handleNotificationAction(data: { action: string }) {
    const [action, taskId, jobId, person] = data.action.split("#");

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
      this.provider.clearNotification(
        { id: person } as Person,
        { id: taskId } as Task,
        { id: jobId } as Job
      );
      return;
    }

    this.emit("action", action, task, job, person);
  }

  syncPersonTask(person: Person, task: Task): Promise<void> {
    if (isTaskActive(task)) {
      const method = person.isHome
        ? this.provider.sendNotification.bind(this.provider)
        : this.provider.clearNotification.bind(this.provider);

      return method(person, task, task.jobs[0]);
    } else {
      if (task.jobs?.[0]) {
        return this.provider.clearNotification(person, task, task.jobs[0]);
      }
    }

    return Promise.resolve();
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
  }

  syncNotifications() {
    console.log("Syncing all tasks notifications");
    return Promise.all(
      this.state.persons
        // .filter((p) => p.id === "person.kevin")
        .map((person) => this.syncPerson(person))
    );
  }
}
