import React, {useEffect, useMemo} from "react";
import {useSelector} from "react-redux";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import Day from "./Day";
import Scale from "./HourScale";
import {fetchTasks, selectAllTasks, selectTasksStatus} from "src/domains/Task/state";

const WeekContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 125%;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

const Week = () => {
  const tasks = useSelector(selectAllTasks);
  const taskStatus = useSelector(selectTasksStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (taskStatus === "idle") {
      dispatch(fetchTasks());
    }
  }, [taskStatus]);

  const startWeek = useMemo(() => {
    const now = new Date();

    now.setDate(now.getDate() - now.getDay());
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now;
  }, []);
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 7);

  const days = useMemo(() => {
    return Array.from({length: 7}, (_, i) => i).map((i: number) => {
      const day = new Date(startWeek);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [startWeek]);

  return (
    <WeekContainer>
      <Scale />
      {days.map((date) => (
        <Day key={date.toISOString()} date={date} />
      ))}
    </WeekContainer>
  );
};

export default Week;
