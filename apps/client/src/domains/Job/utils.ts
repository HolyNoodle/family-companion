import {getFutureMatches} from "@datasert/cronjs-matcher";
import {useMemo} from "react";
import {Task, Job} from "@famcomp/common";
import dayjs from "dayjs";

export interface EventItem {
  date: dayjs.Dayjs;
  task: Task;
  job?: Job;
}

export const useEvents = (tasks: Task[], start: Date, end: Date, desc = false) => {
  return useMemo(() => {
    const iterations = tasks.map((task) => {
      const nextIterations =
        (task.cron &&
          getFutureMatches(task.cron, {
            startAt: new Date().toISOString(),
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
            return job.date.isAfter(start, "minute") && job.date.isBefore(new Date(), "minute");
          })
          .map(
            (job) =>
              ({
                date: job.date,
                task,
                job
              } as EventItem)
          ) || [];

      return [...pastIterations, ...nextIterations];
    });

    return iterations.flat().sort((a, b) => (a.date.toDate().getTime() - b.date.toDate().getTime()) * (desc ? -1 : 1));
  }, [tasks]);
};

export const useDayRange = (start: Date, numberOfDays: number) => {
  return useMemo(() => {
    return Array.from({length: numberOfDays}, (_, i) => i).map((i: number) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [start, numberOfDays]);
};
