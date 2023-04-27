import {Dayjs} from "dayjs";

export interface Participation {
  person: string;
  description: string;
}

export interface Task extends WithId {
  label: string;
  description?: string;
  cron?: string;
  startDate: Dayjs;
  active: boolean;
  jobs: Job[];
}

export interface Job extends WithId {
  date: Dayjs;
  completionDate?: Dayjs;
  participations: Participation[];
}

export interface WithId<U = string> {
  id: U;
};

export interface Person extends WithId {
  name: string;
  internalId: string;
  isHome: boolean;
}