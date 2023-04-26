import React, {useMemo} from "react";
import styled from "styled-components";

import {Space, Typography} from "antd";
import {isJobActive} from "@famcomp/common";
import {EventItem} from "./Event";
import dayjs from "dayjs";

const EventContainer = styled.div<{color: string}>`
  height: 2em;
  display: flex;
  align-items: center;
  border-left: 0.3em solid ${({color}) => color};
  padding-left: 0.3em;

  & + & {
    margin-top: 0.3em;
  }
`;

const colors = {
  completed: "rgba(0, 255, 0, 0.7)",
  cancelled: "grey",
  missed: "darkred",
  pending: "blue",
  coming: "white"
};

const FeedEvent = ({event}: {event: EventItem}) => {
  const mode = useMemo(() => {
    const active = !!event.job && isJobActive(event.task, event.job);

    if (active) {
      return "pending";
    }

    if (event.job && event.job.completionDate) {
      if (event.job?.participations?.length > 0) {
        return "completed";
      }
      return "cancelled";
    }

    return dayjs().isAfter(event.date) ? "missed" : "coming";
  }, [event]) as keyof typeof colors;

  return (
    <EventContainer color={colors[mode]}>
      <Space>
        <span>{event.date.format("HH:mm")}</span>
        <Typography.Text strong>{event.task.label}</Typography.Text>
        <span>{mode}</span>
        {(mode === "completed" || mode === "cancelled") && (
          <>
            <span>
              {event.job?.completionDate?.format("HH:mm") ||
                (event.job && isJobActive(event.task, event.job) ? "In progress" : "Missed")}
            </span>
            <span>{event.job?.participations?.map((participation) => participation.person)}</span>
          </>
        )}
      </Space>
    </EventContainer>
  );
};

export default FeedEvent;
