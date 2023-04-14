import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { JobScheduler } from "./services/job";
import { State } from "./services/state";
import { Job, Task, WithId } from "@famcomp/common";
import { v4 } from "uuid";
import { NotificationServiceProxy } from "./services/notification";
import { RuntimeEnv } from "./services/notification/types";

dotenv.config();

if (!process.env.PORT) {
  console.error("Please specify a PORT variable in the .env file");
  process.exit(1);
}

if (!process.env.STORAGE_PATH) {
  console.error("Please specify a STORAGE_PATH variable in the .env file");
  process.exit(1);
}

const env = process.env.SUPERVISOR_TOKEN
  ? RuntimeEnv.HomeAssistantAddOn
  : RuntimeEnv.Application;
const notification = NotificationServiceProxy.get(env);

if (!notification) {
  console.error("No notification service for this env");
}

let taskScheduler: JobScheduler;
const storagePath = process.env.STORAGE_PATH;
State.setPath(storagePath);

const PORT: number = parseInt(process.env.PORT as string, 10);
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.listen(PORT, async () => {
  console.log(`Listening on port ${PORT}`);

  await notification?.start();

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
    res.send(state.tasks);
  });

  app.post("/tasks/complete", (req, res) => {
    if (!req.body.id) {
      res.writeHead(400, "Id is required");
      res.end();
      return;
    }

    const index = state.tasks.findIndex((t) => t.id === req.body.id);

    if (index < 0) {
      res.writeHead(404, "Task not found");
      res.end();
      return;
    }

    const task = state.tasks[index];

    const jobIndex = task.jobs?.findIndex((j) => j.id === req.body.jobId) || -1;

    if (jobIndex < 0) {
      res.writeHead(404, "Job not found");
      res.end();
      return;
    }

    const job = task.jobs![jobIndex];
    job.completionDate = new Date();
    job.participations.push({
      description: req.body.description,
      person: req.body.person,
    });

    State.set(state);

    notification?.completeJob(task, job);
  });

  app.post("/tasks", (req, res) => {
    const task: WithId<Task> = req.body;
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

    res.send(task);
  });

  app.delete("/tasks", (req, res) => {
    if (!req.body.id) {
      res.writeHead(400, "Id is required");
      res.end();
      return;
    }

    const index = state.tasks.findIndex((t) => t.id === req.body.id);

    if (index < 0) {
      res.writeHead(404, "Task not found");
      res.end();
      return;
    }

    state.tasks.splice(index, 1);

    State.set(state);
    startScheduler(state.tasks);

    res.send(true);
  });

  startScheduler(state.tasks);
});

app.on("close", () => {
  taskScheduler?.stop();
});
