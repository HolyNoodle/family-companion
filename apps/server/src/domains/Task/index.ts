import { EntityState } from "@famcomp/home-assistant";
import { Task } from "@famcomp/common";

export const createTaskId = (taskId: string) => `task.${taskId}`;
export const validateTaskId = (taskId: string) => taskId.indexOf(" ") === -1;
export const createTaskEntity = (task: Task, active = false) =>
  ({
    entity_id: createTaskId(task.id),
    attributes: {},
    state: active ? "on" : "off",
  } as EntityState);

  export const deleteTaskEntity = (taskId: string) =>
  ({
    entity_id: createTaskId(taskId),
    attributes: {},
    state: undefined,
  } as EntityState);
