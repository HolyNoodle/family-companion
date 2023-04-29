import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { State } from "../../state";

import dayjs from "dayjs";
import { AppState } from "../../types";
import NotificationManager from "../Notification";
import { JobScheduler } from "../Job";
import { Stats, Task } from "@famcomp/common";

const PORT: number = 7000;
export default (
  state: AppState,
  notification: NotificationManager,
  taskScheduler: JobScheduler,
  onClose?: () => void
) => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(json());

  return app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT}`);

    app.get("/tasks", (_, res) => {
      res.send(state.tasks).end();
    });
    app.get("/persons", (_, res) => {
      res.send(state.persons).end();
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
      } else {
        state.tasks[index] = task;
      }

      State.set(state);

      taskScheduler.update(req.body.id! as string);

      res.send(task).end();
    });

    app.delete("/tasks", async (req, res) => {
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

      if (state.tasks[index].jobs?.[0]?.completionDate) {
        state.tasks[index].jobs[0].completionDate = dayjs();
      }

      notification.syncNotifications();

      state.tasks.splice(index, 1);

      State.set(state);

      taskScheduler.update(req.query.id! as string);

      res.send(true).end();
    });

    app.post("/upload", async (req, res) => {
      const tasks = req.body;

      state.tasks = tasks;

      State.set(state);

      notification.syncNotifications();

      res.writeHead(200).end();
    });

    app.get("/stats", async (_, res) => {
      const personMap = state.tasks.reduce((map, task) => {
        task.jobs?.forEach((job) => {
          job.participations.forEach((participation) => {
            map[participation.person] = {
              ...(map[participation.person] || {}),
              [task.id]: (map[participation.person]?.[task.id] || 0) + 1,
            };
          });
        });
        return map;
      }, {} as Stats);

      res.send(personMap).end();
    });

    app.on("close", () => {
      onClose?.();
    });
  });
};
