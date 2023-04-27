import React, {useEffect, useMemo, useRef} from "react";
import {useSelector} from "react-redux";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import {fetchTasks, selectAllTasks, selectTasksStatus} from "src/domains/Task/state";
import {useDayRange, useEvents} from "../utils";
import dayjs from "dayjs";
import FeedDay from "../components/FeedDay";

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
  overflow-y: visible;
`;

const PAST = 2;
const FUTURE = 5;

const Feed = () => {
  const feedContainerRef = useRef<HTMLDivElement>();
  const tasks = useSelector(selectAllTasks);
  const taskStatus = useSelector(selectTasksStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (taskStatus === "idle") {
      dispatch(fetchTasks());
    }

    if (taskStatus === "succeeded") {
      const rect = document
        .getElementById("day_" + dayjs().format("DDMMYYYY"))
        .getBoundingClientRect();
      feedContainerRef.current.scrollTo({
        top: rect.top
      });
    }
  }, [taskStatus]);

  const start = useMemo(() => {
    const now = new Date();

    // now.setDate(now.getDate() - PAST);
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now;
  }, []);

  const days = useDayRange(start, FUTURE + PAST);

  const end = new Date(days[days.length - 1]);
  end.setDate(end.getDate() + 1);

  const computedEvents = useEvents(tasks, start, end);

  return (
    <FeedContainer
      ref={(el) => {
        feedContainerRef.current = el;
      }}
    >
      {days.map((date) => {
        const dayEvents = computedEvents
          .filter((e) => e.date.isSame(date, "day"))
          .sort((a, b) => b.date.utcOffset() - a.date.utcOffset());

        return <FeedDay key={date.toISOString()} events={dayEvents} date={date} />;
      })}
    </FeedContainer>
  );
};

export default Feed;
