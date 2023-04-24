import React, {useMemo, useState} from "react";
import styled from "styled-components";
import {useSelector} from "react-redux";

import api from "src/api";
import DayContainer from "../components/DayContainer";
import Scale from "../components/Scale";
import EventCard from "../components/Event";
import TaskForm from "src/domains/Task/components/Form";
import {Task} from "@famcomp/common";
import {fetchTasks, selectAllTasks} from "src/domains/Task/state";
import {useAppDispatch} from "src/store";
import { useEvents } from "../utils";
import dayjs from "dayjs";

export interface DayProps {
  date: Date;
}

const Event = styled.div<{position: number; overlap: number; index: number}>`
  z-index: 1;
  position: absolute;
  top: calc(${({position}) => position}% - 1em);
  height: 2em;
  width: ${({overlap}) => 94 / overlap}%;
  left: ${({index, overlap}) => 3 + index * (94 / overlap)}%;
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

  const tasks = useSelector(selectAllTasks);

  const computedEvents = useEvents(tasks, startDay, endDay);

  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<dayjs.Dayjs>();
  const dispatch = useAppDispatch();

  const handleFormSubmit = async (task: Task) => {
    setSubmitting(true);

    try {
      await api.pushTask(task);

      dispatch(fetchTasks());

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
        <Scale date={date} mode="separator" onClick={(date) => setNewTask(dayjs(date))} />
        {computedEvents
          .sort((a, b) => a.date.utcOffset() - b.date.utcOffset())
          .map((schedule, i) => {
            const date = schedule.date.toDate();
            const position =
              (date.getHours() / 24 + date.getMinutes() / 1440) * 100;

            const overlaps = computedEvents.filter((s) => {
              const min = date.getTime() - 1800 * 1000;
              const max = date.getTime() + 1800 * 1000;

              return s.date.toDate().getTime() >= min && s.date.toDate().getTime() <= max;
            });
            const number = overlaps.length;
            const index = overlaps.findIndex((s) => s === schedule);

            return (
              <Event key={i} index={index} position={position} overlap={number}>
                <EventCard event={schedule} />
              </Event>
            );
          })}
      </>
    </DayContainer>
  );
};

export default Day;
