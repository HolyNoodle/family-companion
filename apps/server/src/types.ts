import { Person, Task } from "@famcomp/common";
import { LogLevel } from "./logger";

export interface AppState {
  tasks: Task[];
  persons: Person[]
}

export interface Options {
  locale: string;
  notificationUrl?: string;
  logLevel: LogLevel;
}