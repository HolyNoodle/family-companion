import React, {useMemo, useState} from "react";
import styled from "styled-components";
import api from "src/api";
import {useAPIData} from "src/utils";
import DayContainer from "../components/DayContainer";
import Scale from "../components/Scale";
import EventCard, {EventItem} from "../components/Event";
import TaskForm from "src/domains/Task/components/Form";
import {Task} from "src/types";

export interface DayProps {
  date: Date;
}

const Event = styled.div<{position: number; overlap: number; index: number}>`
  z-index: 1;
  position: absolute;
  top: calc(${({position}) => position}% - 1em);
  height: 2em;
  width: ${({overlap}) => 94 / overlap}%;
  left: ${({index, overlap}) => 3 + (index * (94 / overlap))}%;
`;

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
    state: {data = []},
    invalidate
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
        return taskSchedule.schedule.map(
          (date) =>
            ({
              date,
              task: taskSchedule
            } as EventItem)
        );
      })
      .flat();
  }, [data]);

  const [selectedEvent, setSelectedEvent] = useState<EventItem>();
  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<Date>();

  const handleFormSubmit = async (task: Task) => {
    setSubmitting(true);

    try {
      await api.pushTask({...task, id: selectedEvent?.task.id});

      invalidate();
      setSelectedEvent(undefined);
      setNewTask(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DayContainer date={date}>
      <TaskForm
        open={!!newTask}
        task={{startDate: newTask}}
        submitting={submitting}
        onSubmit={handleFormSubmit}
        onClose={() => setNewTask(undefined)}
      />

      <>
        <Scale date={date} mode="separator" onClick={(date) => setNewTask(date)} />
        {computedEvents
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((schedule, i) => {
            const position =
              (schedule.date.getHours() / 24 + schedule.date.getMinutes() / 1440) * 100;

            const overlaps = computedEvents.filter((s) => {
              const min = schedule.date.getTime() - 1800 * 1000;
              const max = schedule.date.getTime() + 1800 * 1000;

              return s.date.getTime() >= min && s.date.getTime() <= max;
            });
            const number = overlaps.length;
            const index = overlaps.findIndex(s => s === schedule);

            return (
              <Event
                key={i}
                index={index}
                position={position}
                onClick={() => setSelectedEvent(schedule)}
                overlap={number}
              >
                <EventCard event={schedule} />
              </Event>
            );
          })}
      </>
    </DayContainer>
  );
};

export default Day;
