import dayjs from "dayjs";
import {Person, Stats, Task} from "@famcomp/common";
import {getBaseURL} from "./utils";

export interface JobSchedule extends Task {
  schedule: dayjs.Dayjs[];
}

class API {
  host: string;
  baseURL: string;
  constructor() {
    const isSelfHosted = window.location.host.indexOf(":8080") > -1;
    this.host = isSelfHosted ? "localhost:7000" : window.location.host;
    this.baseURL = getBaseURL(window.location) + (isSelfHosted ? "" : "api/");
  }
  buildURL(path: string) {
    return `http://${this.host}${this.baseURL}${path}`;
  }
  getTasks(): Promise<Task[]> {
    return fetch(this.buildURL("/tasks"))
      .then((response) => {
        return response.json() as Promise<Task[]>;
      })
      .then((json) => {
        return json.map((task) => ({
          ...task,
          startDate: dayjs(task.startDate)
        }));
      });
  }
  uploadBackup(data: Task[]) {
    return fetch(this.buildURL("/upload"), {
      method: "post",
      body: JSON.stringify(data),

      headers: {
        "Content-type": "application/json"
      }
    });
  }
  getPersons(): Promise<Person[]> {
    return fetch(this.buildURL("/persons")).then(
      (response) => response.json() as Promise<Person[]>
    );
  }
  getStats(): Promise<Stats> {
    return fetch(this.buildURL("/stats")).then((response) => response.json() as Promise<Stats>);
  }
  pushTask(task: Task) {
    return fetch(this.buildURL("/tasks"), {
      method: "POST",
      body: JSON.stringify({
        ...task,
        startDate: task.startDate?.toISOString()
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
