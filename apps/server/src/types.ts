import { Person, Task } from "@famcomp/common";

export interface AppState {
  tasks: Task[];
  persons: Person[]
}

export interface Options {
  locale: string;
  famCompUIBaseUrl?: string;
}