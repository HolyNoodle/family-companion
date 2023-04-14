import { Task, WithId } from "@famcomp/common";

export interface AppState {
  tasks: WithId<Task>[];
}
