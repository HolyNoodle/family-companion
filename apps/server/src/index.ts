import { JobScheduler } from "./domains/Job";
import { State } from "./state";
import { Job, Task } from "@famcomp/common";
import { getTranslator } from "@famcomp/translations";

import { HomeAssistantConnection } from "@famcomp/home-assistant";
import NotificationManager from "./domains/Notification";
import API from "./domains/API";
import { existsSync, readFileSync } from "fs";
import { Options } from "./types";

if (!process.env.STORAGE_PATH) {
  console.error(
    "Please specify a STORAGE_PATH variable in the environment variables"
  );
  process.exit(1);
}

const storagePath = process.env.STORAGE_PATH;
State.setPath(storagePath);

const start = async () => {
  console.log("Checking configuration");
  const configCheck = (): Options => {
    try {
      if (existsSync("/data/options.json")) {
        console.log("Loading config");
        return JSON.parse(readFileSync("/data/options.json").toString());
      } else {
        console.log("No configuration present");
      }
    } catch (ex) {
      console.error("Error while checking config file", ex);
    }

    console.log("Returning default config");
    return {
      locale: "en",
      // famCompUIBaseUrl: "http://192.168.1.35:8123/cc93577a_fam_comp/dashboard"
    };
  };
  const config: Options = configCheck();
  const locale = config.locale;

  console.log("Configuration:");
  console.log("Language:", config.locale);
  console.log("FamCompUIURL:", config.famCompUIBaseUrl);

  const translator = getTranslator(locale as any);

  const connection = new HomeAssistantConnection(process.env.SUPERVISOR_TOKEN!);
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
  console.log("Retrieving persons");
  state.persons = await connection.getPersons();

  const taskScheduler = new JobScheduler(state);
  const notification = new NotificationManager(
    connection,
    state,
    translator,
    config.famCompUIBaseUrl
  );

  connection.subscribeToEvent("trigger_task");
  connection.addListener("trigger_task", ({ id }: { id: string }) => {
    const task = state.tasks.find((t) => t.id === id);

    if (!task) {
      console.log("Task", id, "not found");
      return;
    }

    console.log("Task trigger through home assistant event", task.id);
    taskScheduler.triggerTask(task);
  });

  taskScheduler.on("start_job", (task: Task, job: Job) => {
    console.log("scheduler start job");
    notification.syncTask(task);

    connection.fireEvent("task_triggered", {
      task,
      job,
    });

    State.set(state);
  });

  notification.on(
    "action",
    (action: string, task: Task, job: Job, person: string) => {
      switch (action) {
        case "trigger":
          taskScheduler.triggerTask(task);
          break;
        case "complete":
          taskScheduler.completeJob(job, person);

          connection.fireEvent("task_completed", {
            task,
            job,
            person,
          });
          break;
        case "cancel":
          taskScheduler.cancelJob(job);

          connection.fireEvent("task_canceled", {
            task,
            job,
            person,
          });
          break;
      }

      notification.syncTask(task);

      State.set(state);
    }
  );

  const app = API(state, notification, taskScheduler, () => {
    console.log("Stopping family companion app");
    taskScheduler?.stop();
    connection.stop();
  });

  taskScheduler.start();

  notification.syncNotifications();

  process.on("SIGTERM", () => {
    console.info("SIGTERM signal received.");
    app.close();

    process.exit(0);
  });
};

start();
