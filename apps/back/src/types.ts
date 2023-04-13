export interface Participation {
    person: string;
    description: string;
}

export interface Task {
    label: string;
    description?: string;

    lastUpdatedBy: string;
    lastUpdatedAt: Date;

    cron: string;

    startDate?: Date;
    endDate?: Date;
    active?: boolean;

    jobs?: WithId<Job>[];
}

export interface Job {
    date: Date;
    completionDate?: Date;
    participations: Participation[];
}

export type WithId<T> = T & {
    id: string;
}

export interface AppState {
    tasks: WithId<Task>[];
}
