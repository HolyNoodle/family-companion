import React, {useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import styled from "styled-components";

import {useAppDispatch} from "src/store";

import {fetchTasks, selectAllTasks, selectTasksStatus} from "src/domains/Task/state";
import {useEvents} from "../utils";
import {Button} from "antd";
import dayjs from "dayjs";
import TaskForm from "src/domains/Task/components/Form";
import {Task} from "@famcomp/common";
import api from "src/api";
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

  const end = new Date(days[days.length - 1]);
  end.setDate(end.getDate() + 1);

  const computedEvents = useEvents(tasks, start, end);
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Task>(undefined);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (task: Task) => {
    setCreating(true);
    try {
      await api.pushTask(task);
      setCreate(false);
      setEdit(undefined);
      dispatch(fetchTasks());
    } finally {
      setCreating(false);
    }
  };

  return (
    <FeedContainer
      ref={(el) => {
        feedContainerRef.current = el;
      }}
    >
      <TaskForm
        submitting={creating}
        open={!!edit}
        task={edit}
        onSubmit={handleSubmit}
        onClose={() => setEdit(undefined)}
      />
      <TaskForm
        submitting={creating}
        open={create}
        onSubmit={handleSubmit}
        onClose={() => setCreate(false)}
      />
      <Button
        onClick={() => {
          setEdit(undefined);
          setCreate(true);
        }}
      >
        Add task
      </Button>
      {tasks.map((task) => {
        return (
          <div key={task.id}>
            {task.label}{" "}
            <Button
              onClick={() => {
                setEdit(task);
                setCreate(false);
              }}
            >
              Edit
            </Button>
            <Button
              onClick={async () => {
                await api.deleteTask(task.id);
                dispatch(fetchTasks());
              }}
            >
              Delete
            </Button>
          </div>
        );
      })}

      {days.map((date) => {
        const dayEvents = computedEvents
          .filter((e) => e.date.isSame(date, "day"))
          .sort((a, b) => b.date.utcOffset() - a.date.utcOffset());

        return <FeedDay events={dayEvents} date={date} />;
      })}
    </FeedContainer>
  );
};

export default Feed;
