import { JobScheduler } from "./domains/Job";
import { State } from "./state";
import { Job, Task } from "@famcomp/common";
import { getTranslator } from "@famcomp/translations";

import { HomeAssistantConnection } from "@famcomp/home-assistant";
import NotificationManager from "./domains/Notification";
import API from "./domains/API";
import { existsSync, readFileSync } from "fs";
import { Options } from "./types";
import Logger, { LogLevel } from "./logger";

export const start = async (process: NodeJS.Process) => {
  const defaultLogger = new Logger();

  const storagePath = process.env.STORAGE_PATH || "/data/db";
  defaultLogger.info("Storage path:", storagePath);

  State.setPath(storagePath);
  defaultLogger.info("Checking configuration");
  const configCheck = (): Options => {
    try {
      if (existsSync("/data/options.json")) {
        defaultLogger.info("Loading config");
        return JSON.parse(readFileSync("/data/options.json").toString());
      } else {
        defaultLogger.info("No configuration present");
      }
    } catch (ex: any) {
      defaultLogger.error("Error while checking config file", ex);
    }

    defaultLogger.info("Returning default config");
    return {
      locale: "en",
      logLevel: LogLevel.INFO,
    };
  };

  const config: Options = configCheck();
  const locale = config.locale;

  const logger = new Logger(config.logLevel);

  logger.info("Configuration:");
  logger.info("Log level:", LogLevel[config.logLevel]);
  logger.info("Language:", config.locale);
  logger.info("Notification url:", config.notificationUrl || "N/A");

  const translator = getTranslator(locale as any);

  const connection = new HomeAssistantConnection(process.env.SUPERVISOR_TOKEN!);
  logger.info("Starting home assistant connection");
  try {
    await connection.start();
    logger.info("Home assistant connection is ready");
  } catch (ex: any) {
    logger.error("An error occured while starting home assistant connection");
    logger.error("Error:", ex);
    process.exit(1);
  }

  logger.debug("Retrieving state");
  const state = await State.get();

  logger.debug("Retrieving persons");
  state.persons = await connection.getPersons();

  const taskScheduler = new JobScheduler(state, logger);
  const notification = new NotificationManager(
    connection,
    state,
    translator,
    logger,
    config.notificationUrl
  );

  connection.subscribeToEvent("trigger_task");
  connection.addListener("trigger_task", ({ id }: { id: string }) => {
    const task = state.tasks.find((t) => t.id === id);

    if (!task) {
      logger.info("Task", id, "not found");
      return;
    }

    logger.info("Task trigger through home assistant event", task.id);
    taskScheduler.triggerTask(task);
  });

  taskScheduler.on("start_job", (task: Task, job: Job) => {
    logger.info("Scheduler start job");
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

  const app = API(state, notification, taskScheduler, logger, () => {
    logger.info("Stopping family companion app");
    taskScheduler.stop();
    connection.stop();
  });

  taskScheduler.start();
  notification.syncNotifications();

  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received.");
    app.close();

    process.exit(0);
  });
};