export interface Locale {
  short_date: string;
  long_date: string;
  time: string;

  notifications: {
    actions: {
      todo: {
        title: string;
        action: string;
      };
      quick: string;
      complete: string;
      cancel: string;
    };
  };
  routes: {
    tasks: string;
    dashboard: string;
    schedule: string;
  };
  task: {
    properties: {
      name: string;
      id: string;
      cron: string;
      cronIterations: string;
      label: string;
      description: string;
      quickAction: string;
    };
    actions: {
      create: string;
      upload: string;
      download: string;
      confirmDelete: string;
    };
  };
}
