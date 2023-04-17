import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { JobScheduler, getExecutionDates } from "./domains/Job";
import { State } from "./state";
import { Job, Task, WithId } from "./types";
import { v4 } from "uuid";

import { HomeAssistantConnection } from "./connection";
import { HomeAssistantNotificationProvider } from "./domains/Notification";
import path from "path";

if (!process.env.STORAGE_PATH) {
  console.error(
    "Please specify a STORAGE_PATH variable in the environment variables"
  );
  process.exit(1);
}

const connection = new HomeAssistantConnection(process.env.SUPERVISOR_TOKEN!);
const notification = new HomeAssistantNotificationProvider(connection);

if (!notification) {
  console.error("No notification service for this env");
}

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
  await connection.start();
  console.log("Home assistant connection is ready");

  const state = await State.get();

  const startScheduler = (tasks: WithId<Task>[]) => {
    if (taskScheduler) {
      taskScheduler.stop();
    }

    taskScheduler = new JobScheduler(tasks);

    taskScheduler.on("start_job", (task: WithId<Task>, job: WithId<Job>) => {
      notification?.createJob(task, job);
      State.set(state);
    });

    taskScheduler.start();
  };

  app.get("/tasks", (_, res) => {
    res.send(state.tasks).end();
  });

  app.get("/tasks/action", (req, res) => {
    console.log(req.query);
    if (!req.query.taskId) {
      res.writeHead(400, "Task Id is required");
      res.end();
      return;
    }

    const index = state.tasks.findIndex((t) => t.id === req.query.taskId);

    if (index < 0) {
      res.writeHead(404, "Task not found");
      res.end();
      return;
    }

    const task = state.tasks[index];

    const jobIndex =
      task.jobs?.findIndex((j) => j.id === req.query.jobId) || -1;

    if (jobIndex < 0) {
      res.writeHead(404, "Job not found");
      res.end();
      return;
    }

    const job = task.jobs![jobIndex];

    switch (req.query.action) {
      case "COMPLETE":
        job.completionDate = new Date();
        notification?.completeJob(task, job);
      case "PARTICIPATE":
        job.participations.push({
          description: req.body.description,
          person: req.body.person,
        });
        break;
      case "CANCEL":
        notification?.completeJob(task, job);
        break;
    }

    State.set(state);

    res.writeHead(204).end();
  });

  app.post("/tasks", (req, res) => {
    const task: WithId<Task> = req.body;

    if (!task.label || !task.cron) {
      res.writeHead(400, "Invalid task parameters").end();
      return;
    }

    if (!task.id) {
      task.id = v4();
      state.tasks.push(task);
    } else {
      const index = state.tasks.findIndex((t) => t.id === task.id);

      if (index < 0) {
        res.writeHead(404, "Task not found");
        res.end();
        return;
      }

      state.tasks[index] = req.body;
    }

    State.set(state);

    startScheduler(state.tasks);

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
    startScheduler(state.tasks);

    res.send(true).end();
  });

  app.get("/schedule", (req, res) => {
    const { start, end } = req.query;
    const startDate = start? new Date(start as string) : new Date();
    const endDate = end? new Date(end as string) : new Date();

    const result = state.tasks.map((task) => {
      return {
        ...task,
        schedule: getExecutionDates(task, startDate, endDate),
      };
    });

    res.send(result).end();
  });

  startScheduler(state.tasks);
});

app.on("close", () => {
  console.log("Stopping family companion app");
  taskScheduler?.stop();
  connection.stop();
});
