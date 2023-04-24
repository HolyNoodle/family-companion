import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { JobScheduler, getExecutionDates } from "./domains/Job";
import { State } from "./state";
import { Job, Task } from "@famcomp/common";

import { HomeAssistantConnection } from "@famcomp/home-assistant";
import { HomeAssistantNotificationProvider } from "./domains/Notification";
import { createTaskEntity, deleteTaskEntity } from "./domains/Task";
import dayjs from "dayjs";

if (!process.env.STORAGE_PATH) {
  console.error(
    "Please specify a STORAGE_PATH variable in the environment variables"
  );
  process.exit(1);
}

const connection = new HomeAssistantConnection(process.env.SUPERVISOR_TOKEN!);
const notification = new HomeAssistantNotificationProvider(connection);

let taskScheduler: JobScheduler;
const storagePath = process.env.STORAGE_PATH;
State.setPath(storagePath);

const PORT: number = 7000;
const app = express();

app.use(helmet());
app.use(cors());
app.use(json());

app.use(express.static("public"));

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);

  console.log("Starting home assistant connection");
  try {
    await connection.start();
    console.log("Home assistant connection is ready");
  } catch (ex) {
    console.error("An error occured while starting home assistant connection");
    console.error("Error:", ex);
    process.exit(1);
  }

  const state = await State.get();

  taskScheduler = new JobScheduler(state.tasks);

  taskScheduler.on("start_job", (task: Task, job: Job) => {
    console.log("scheduler start job");
    notification.createJob(task, job);

    connection.createOrUpdateEntity(createTaskEntity(task, true));

    State.set(state);
  });

  app.get("/tasks", (_, res) => {
    res.send(state.tasks).end();
  });

  app.get("/tasks/action", async (req, res) => {
    console.log(req.query);
    if (!req.query.taskId) {
      console.log("no id");
      res.writeHead(400, "Task Id is required");
      res.end();
      return;
    }
    const state = await State.get();

    const task = state.tasks.find((t) => t.id === req.query.taskId);

    if (!task) {
      console.log("no task");

      res.writeHead(404, "Task not found");
      res.end();
      return;
    }

    console.log(task.jobs);

    const job = task.jobs?.find((j) => j.id === req.query.jobId);

    if (!job) {
      console.log("no job");

      res.writeHead(404, "Job not found");
      res.end();
      return;
    }

    switch (req.query.action) {
      case "COMPLETE":
        job.completionDate = dayjs();
        notification?.completeJob(task, job);
        connection.createOrUpdateEntity(createTaskEntity(task, false));
      case "PARTICIPATE":
        if (
          !job.participations.some(
            (participation) => participation.person === req.query.person
          )
        ) {
          job.participations.push({
            description: req.body.description,
            person: req.query.person as string,
          });
        }
        break;
      case "CANCEL":
        notification?.completeJob(task, job);
        break;
    }

    State.set(state);

    res.send(true).end();
  });

  app.post("/tasks", (req, res) => {
    const task: Task = req.body;

    if (!task.id || !task.label) {
      res.writeHead(400, "Invalid task parameters").end();
      return;
    }

    const index = state.tasks.findIndex((t) => t.id === task.id);

    if (index < 0) {
      state.tasks.push(task);

      connection.createOrUpdateEntity(createTaskEntity(task));
    }

    State.set(state);

    taskScheduler.update(req.body.id! as string);

    res.send(task).end();
  });

  app.delete("/tasks", (req, res) => {
    if (!req.query.id) {
      res.writeHead(400, "Id is required");
      res.end();
      return;
    }

    const index = state.tasks.findIndex((t) => t.id === req.query.id);

    if (index < 0) {
      res.writeHead(404, "Task not found");
      res.end();
      return;
    }

    state.tasks.splice(index, 1);

    State.set(state);

    taskScheduler.update(req.query.id! as string);

    connection.createOrUpdateEntity(deleteTaskEntity(req.query.id as string));

    res.send(true).end();
  });

  app.get("/schedule", (req, res) => {
    const { start, end } = req.query;
    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end ? new Date(end as string) : new Date();

    const result = state.tasks.map((task) => {
      return {
        ...task,
        schedule: getExecutionDates(task, startDate, endDate),
      };
    });

    res.send(result).end();
  });

  app.get("/stats", async (req, res) => {
    const persons = await connection.getPersons();

    type Stats = {
      [person: string]: {
        [task: string]: number;
      };
    };
    const personMap = state.tasks.reduce((map, task) => {
      task.jobs?.forEach((job) => {
        job.participations.forEach((participation) => {
          map[participation.person] = {
            ...(map[participation.person] || {}),
            [task.id]: (map[participation.person][task.id] || 0) + 1,
          };
        });
      });
      return map;
    }, {} as Stats);

    res.send(personMap).end();
  });

  taskScheduler.start();
});

app.on("close", () => {
  console.log("Stopping family companion app");
  taskScheduler?.stop();
  connection.stop();
});
