import React, {useMemo} from "react";
import api from "src/api";
import {useAPIData} from "src/utils";

export interface DayProps {
  date: Date;
}

const Day = ({date}: DayProps) => {
  const startDay = useMemo(() => {
    const day = new Date(date);

    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);

    return day;
  }, []);
  const endDay = new Date(startDay);
  endDay.setDate(endDay.getDate() + 1);

  const {
    state: {data = []}
  } = useAPIData(api.getSchedule, startDay, endDay);

  const computedEvents = useMemo(() => {
    return data
      .map((schedule) => {
        return {
          ...schedule,
          schedule: schedule.schedule.filter(
            (scheduleDate) =>
              scheduleDate.getFullYear() === date.getFullYear() &&
              scheduleDate.getMonth() === date.getMonth() &&
              scheduleDate.getDate() === date.getDate()
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
  }, [data]);

  return (
    <div>
      <span>{date.toLocaleDateString()}</span>
      <ul>
        {computedEvents
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((schedule, i) => (
            <li key={i}>
              {schedule.date.toLocaleTimeString()} - {schedule.task.label}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Day;
