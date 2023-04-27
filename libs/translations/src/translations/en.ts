import { Locale } from "../types";

export default {
  long_date: "LL",
  short_date: "MM/DD/YYYY",
  time: "LT",
  notifications: {
    actions: {
      quick: {
        action: "Trigger",
        title: "Quick action"
      },
      todo: {
        title: "Create a todo task",
        action: "Create",
      },
      cancel: "Cancel",
      complete: "Done",
    },
  },
  routes: {
    dashboard: "Statistics",
    schedule: "Schedule",
    tasks: "Configuration"
  },
  task: {
    properties: {
      name: "Task",
      cron: "CRON",
      cronIterations: "Iterations example",
      description: "Description",
      id: "Unique id",
      label: "Title",
      quickAction: "Quick action",
    },
    actions: {
      create: "Create a task",
      download: "Save",
      upload: "Import",
      confirmDelete: "Are you sure you want to delete this task?",
    },
  },
} as Locale;
