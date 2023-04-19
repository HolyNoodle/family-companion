import dayjs from "dayjs";

export interface AppState {
  tasks: WithId<Task>[];
}

export interface Participation {
  person: string;
  description: string;
}

export interface Task {
  label: string;
  description?: string;

  lastUpdatedBy: string;
  lastUpdatedAt: dayjs.Dayjs;

  cron: string;

  startDate: dayjs.Dayjs;
  endDate?: dayjs.Dayjs;
  active?: boolean;

  jobs?: WithId<Job>[];
}

export interface Job {
  date: dayjs.Dayjs;
  completionDate?: dayjs.Dayjs;
  participations: Participation[];
}

export type WithId<T> = T & {
  id: string;
};

export interface JobSchedule extends WithId<Task> {
  schedule: dayjs.Dayjs[];
}
