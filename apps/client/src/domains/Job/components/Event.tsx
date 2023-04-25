import React, {useState} from "react";
import styled from "styled-components";
import {Job, Task, WithId} from "@famcomp/common";
import {Button, Popover, Space, Typography} from "antd";
import TaskForm from "src/domains/Task/components/Form";
import api from "src/api";
import {fetchTasks} from "src/domains/Task/state";
import {useAppDispatch} from "src/store";
import dayjs from "dayjs";

export interface EventItem {
  date: dayjs.Dayjs;
  task: Task;
  job?: Job;
}

const EventContainer = styled.div<{completed: boolean}>`
  font-size: 0.9em;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow: 3px;
  background-color: ${({completed}) => (completed ? "green" : "rgba(230, 230, 230, 1)")};
  white-space: nowrap;
  cursor: pointer;
`;

export interface EventProps {
  event: EventItem;
}

const EventCard = ({event}: EventProps) => {
  const [details, setDetails] = useState(false);
  const [edit, setEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useAppDispatch();

  const handleFormSubmit = async (task: Task) => {
    setSubmitting(true);

    try {
      await api.pushTask({...task, id: event.task.id});

      dispatch(fetchTasks());

      setEdit(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await api.deleteTask(event.task.id);

      dispatch(fetchTasks());
      setDetails(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = !!event.job?.completionDate;
  const completedBy = event.job?.participations.map((p) => p.person).join(", ");

  return (
    <Popover
      content={
        <>
          {event.task.description && (
            <Typography.Paragraph>
              <pre>{event.task.description}</pre>
            </Typography.Paragraph>
          )}
          <Space size="small" direction="horizontal">
            <Button disabled={submitting} type="primary" danger size="small" onClick={handleDelete}>
              Delete
            </Button>

            <Button
              disabled={submitting}
              type="default"
              onClick={() => {
                setEdit(true);
                setDetails(false);
              }}
              size="small"
            >
              Edit
            </Button>
          </Space>
        </>
      }
      title={event.task.label}
      trigger="click"
      open={details}
      onOpenChange={(visible) => setDetails(visible)}
    >
      <EventContainer completed={isCompleted}>
        <TaskForm
          open={edit}
          submitting={submitting}
          task={event.task}
          onSubmit={handleFormSubmit}
          onClose={() => setEdit(false)}
        />
        <Typography.Text ellipsis>{event.task.label}</Typography.Text>
      </EventContainer>
    </Popover>
  );
};

export default EventCard;