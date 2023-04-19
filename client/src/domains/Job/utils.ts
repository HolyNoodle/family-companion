import {getFutureMatches} from "@datasert/cronjs-matcher";
import {useMemo} from "react";
import {Task, WithId} from "src/types";
import {EventItem} from "./components/Event";
import dayjs from "dayjs";

export const useEvents = (tasks: WithId<Task>[], start: Date, end: Date) => {
  return useMemo(() => {
    const now = new Date();
    return tasks
      .map((task) => {
        const nextIterations = getFutureMatches(task.cron, {
          startAt: (start.getTime() < now.getTime() ? now : start).toISOString(),
          endAt: end.toISOString(),
          matchCount: 50
        }).map(
          (date) =>
            ({
              date: dayjs(date),
              task
            } as EventItem)
        );

        const pastIterations = task.jobs
          ?.filter((job) => {
            return job.date.isAfter(start) && job.date.isBefore(end);
          })
          .map(
            (job) =>
              ({
                date: job.date,
                task,
                job
              } as EventItem)
          ) || [];

          console.log(pastIterations);

        return [...pastIterations, ...nextIterations];
      })
      .flat();
  }, [tasks]);
};
