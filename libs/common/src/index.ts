import { Job, Task } from "./types";

export * from "./types";

export const isTaskActive = (task: Task) => {
  const activeJob = task.jobs?.[0];

  if(!activeJob) {
    return false;
  }

  if(activeJob.completionDate !== undefined) {
    return false;
  }

  return true;
};

export const isJobActive = (task: Task, job: Job) => {
  if(!isTaskActive(task)) {
    return false;
  }

  return task.jobs![0].id === job.id;
};
