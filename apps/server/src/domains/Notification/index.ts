import { Person, Task, isTaskActive } from "@famcomp/common";
import { HomeAssistantConnection } from "@famcomp/home-assistant";
import { HomeAssistantNotificationProvider } from "@famcomp/notification";
import { AppState } from "../../types";
import dayjs from "dayjs";
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

    this.syncPersonNotifications(personObject);
  }

  private handleNotificationAction(data: { action: string }) {
    const [action, args] = data.action.split("#");
    const [taskId, jobId, person] = args.split("_");

    const task = this.state.tasks.find((t) => t.id === taskId);

    if (!task) {
      console.log("Couldn't find task for this action", action);
      return;
    }

    const job = task.jobs?.find((j) => j.id === jobId);

    if (!job) {
      console.log("Couldn't find job for this action", action);
      return;
    }

    this.emit("action", action, task, job, person);
  }

  syncPersonNotifications(person: Person) {
    const activeTasks = this.state.tasks.filter(isTaskActive);
    const inactiveTasks = this.state.tasks.filter(
      (t) => !isTaskActive(t) && !!t.jobs?.[0]
    );

    const method = person.isHome
      ? this.provider.sendNotification.bind(this.provider)
      : this.provider.clearNotification.bind(this.provider);

    const inactivePromises = inactiveTasks.map((task) =>
      this.provider.clearNotification(person, task, task.jobs[0])
    );
    const activePromises = activeTasks.map((task) =>
      method(person, task, task.jobs[0])
    );

    return Promise.all([...activePromises, inactivePromises]);
  }

  syncNotifications() {
    console.log("Syncing all tasks notifications");
    return Promise.all(
      this.state.persons
        .filter((p) => p.id === "person.kevin")
        .map((person) => this.syncPersonNotifications(person))
    );
  }
}
