import dayjs from "dayjs";
import {JobSchedule, Task, WithId} from "./types";

class API {
  host: string;
  constructor() {
    this.host = window.location.host.split(":")[0] + ":7000";
  }
  buildURL(path: string) {
    return `http://${this.host}${path}`;
  }
  getTasks(): Promise<WithId<Task>[]> {
    return fetch(this.buildURL("/tasks"))
      .then((response) => {
        return response.json() as Promise<WithId<Task>[]>;
      })
      .then((json) => {
        return json.map((task) => ({
          ...task,
          startDate: dayjs(task.startDate),
          endDate: task.endDate ? dayjs(task.endDate) : undefined
        }));
      });
  }
  pushTask(task: Task | WithId<Task>) {
    return fetch(this.buildURL("/tasks"), {
      method: "POST",
      body: JSON.stringify({
        ...task,
        startDate: task.startDate?.toISOString(),
        lastUpdatedBy: "person.kevin"
      }),
      headers: {
        "Content-type": "application/json"
      }
    }).then((response) => {
      return response.json();
    });
  }
  deleteTask(taskId: string) {
    return fetch(this.buildURL("/tasks?id=" + taskId), {method: "DELETE"}).then((response) => {
      return response.status === 200;
    });
  }
  getSchedule(startDate: Date, endDate: Date): Promise<JobSchedule[]> {
    return fetch(
      this.buildURL(`/schedule?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
    )
      .then((response) => {
        return response.json() as Promise<JobSchedule[]>;
      })
      .then((json) => {
        return json.map(
          (task) =>
            ({
              ...task,
              schedule: task.schedule.map((date) => dayjs(date))
            } as JobSchedule)
        );
      });
  }
}

export default new API();
