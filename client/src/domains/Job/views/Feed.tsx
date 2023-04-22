import React, {useEffect, useMemo, useRef} from "react";
import {useSelector} from "react-redux";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import {fetchTasks, selectAllTasks, selectTasksStatus} from "src/domains/Task/state";
import {useEvents} from "../utils";
import {Space} from "antd";
import dayjs from "dayjs";

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

const FeedDay = styled.div`
  > h1 {
  }
  > div {
  }
`;

const Feed = () => {
  const feedContainerRef = useRef<HTMLDivElement>();
  const tasks = useSelector(selectAllTasks);
  const taskStatus = useSelector(selectTasksStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let timer: any;
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

    now.setDate(now.getDate() - PAST);
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now;
  }, []);

  const days = useMemo(() => {
    return Array.from({length: FUTURE + PAST}, (_, i) => i).map((i: number) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [start]);

  const end = new Date(start);
  end.setDate(end.getDate() + 3);

  const computedEvents = useEvents(tasks, start, end);

  return (
    <FeedContainer
      ref={(el) => {
        feedContainerRef.current = el;
      }}
    >
      {days.map((date) => (
        <FeedDay key={dayjs(date).format("DDMMYYYY")}>
          <h1 id={`day_${dayjs(date).format("DDMMYYYY")}`}>{date.toLocaleDateString()}</h1>
          <div>
            {days.map((date) => {
              const dayEvents = computedEvents.filter((e) => e.date.isSame(date, "day"));

              return dayEvents.map((event) => (
                <div key={event.task.id + event.date.toISOString()}>
                  <Space>
                    <span>{event.date.format("HH:mm")}</span>
                    <span>{event.task.label}</span>
                  </Space>
                </div>
              ));
            })}
          </div>
        </FeedDay>
      ))}
    </FeedContainer>
  );
};

export default Feed;
