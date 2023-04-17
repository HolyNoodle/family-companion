import React, {useMemo} from "react";
import {JobSchedule} from "src/types";

export interface DayProps {
  date: Date;
  events: JobSchedule[];
}

const Day = ({date, events}: DayProps) => {
  const computedEvents = useMemo(() => {
    return events
      .map((schedule) => {
        return {
          ...schedule,
          schedule: schedule.schedule.filter(
            (date) =>
              date.getFullYear() === date.getFullYear() &&
              date.getMonth() === date.getMonth() &&
              date.getDate() === date.getDate()
          )
        };
      })
      .filter((schedule) => {
        return schedule.schedule.length > 0;
      })
      .map((taskSchedule) => {
        return taskSchedule.schedule.map((date) => ({
          date,
          task: taskSchedule
        }));
      })
      .flat();
  }, [events]);

  return (
    <div>
      <span>{date.toLocaleDateString()}</span>
      <ul>
        {computedEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map((schedule, i) => (
          <li key={i}>
            {schedule.date.toLocaleTimeString()} - {schedule.task.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Day;
