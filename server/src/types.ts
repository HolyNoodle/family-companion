export interface AppState {
  tasks: Task[];
}

export interface Participation {
  person: string;
  description: string;
}

export interface Task extends WithId {
  label: string;
  description?: string;

  cron: string;

  startDate?: Date;
  active?: boolean;

  jobs?: Job[];
}

export interface Job extends WithId {
  date: Date;
  completionDate?: Date;
  participations: Participation[];
}

export interface WithId<U = string> {
  id: U;
};

export interface Person extends WithId {
  name: string;
  device?: string;
}