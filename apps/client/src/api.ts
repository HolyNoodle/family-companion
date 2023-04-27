import dayjs from "dayjs";
import {Person, Task} from "@famcomp/common";

export interface JobSchedule extends Task {
  schedule: dayjs.Dayjs[];
}

class API {
  host: string;
  baseURL: string;
  constructor() {
    this.host = window.location.host;
    this.baseURL = window.location.pathname || "/";
  }
  buildURL(path: string) {
    return `http://${this.host}${this.baseURL}api${path}`;
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
  getPersons(): Promise<Person[]> {
    return fetch(this.buildURL("/persons")).then((response) => {
      return response.json() as Promise<Person[]>;
    });
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
