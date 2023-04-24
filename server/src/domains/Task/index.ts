import { EntityState } from "../../connection";
import { Task } from "../../types";

export const createTaskId = (task: Task) => `task.${task.id}`;
export const validateTaskId = (taskId: string) => taskId.indexOf(" ") === -1;
export const createTaskEntity = (task: Task, active = false) =>
  ({
    entity_id: createTaskId(task),
    attributes: {},
    state: active,
  } as EntityState);
