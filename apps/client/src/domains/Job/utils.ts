import {getFutureMatches} from "@datasert/cronjs-matcher";
import {useMemo} from "react";
import {Task, WithId} from "@famcomp/common";
import {EventItem} from "./components/Event";
import dayjs from "dayjs";

export const useEvents = (tasks: Task[], start: Date, end: Date) => {
  return useMemo(() => {
    const iterations = tasks.map((task) => {
      const nextIterations =
        (task.cron &&
          getFutureMatches(task.cron, {
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            matchCount: 50
          }).map(
            (date) =>
              ({
                date: dayjs(date),
                task
              } as EventItem)
          )) ||
        [];

      const pastIterations =
        task.jobs
          .filter((job) => {
            return job.date.isAfter(start, "minute") && job.date.isBefore(end, "minute");
          })
          .map(
            (job) =>
              ({
                date: job.date,
                task,
                job
              } as EventItem)
          ) || [];

      return [...pastIterations, ...nextIterations].sort(
        (a, b) => a.date.utcOffset() - b.date.utcOffset()
      );
    });

    return iterations.flat();
  }, [tasks]);
};
