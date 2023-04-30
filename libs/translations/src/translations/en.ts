import { Locale } from "../types";

export default {
  long_date: "LL",
  short_date: "MM/DD/YYYY",
  time: "LT",
  notifications: {
    actions: {
      quick: "Quick actions",
      todo: {
        title: "Create a todo task",
        action: "Create",
      },
      cancel: "Cancel",
      complete: "Done",
    },
  },
  stats: {
    involment: "Involment",
    past: "History",
  },
  routes: {
    dashboard: "Statistics",
    schedule: "Schedule",
    tasks: "Configuration",
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
      logs: "Logs",
    },
  },
} as Locale;
