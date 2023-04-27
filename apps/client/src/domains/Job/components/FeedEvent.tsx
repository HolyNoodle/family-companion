import React, {useMemo} from "react";
import styled from "styled-components";

import {Popover, Space, Typography} from "antd";
import {isJobActive} from "@famcomp/common";
import {EventItem} from "./Event";
import dayjs from "dayjs";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  MinusOutlined
} from "@ant-design/icons";
import PersonFromId from "src/domains/Person/views/PersonFromId";

const Hour = styled.span`
  color: grey;
  font-size: 0.9em;
`;

const EventContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0.3em 0;

  & + & {
    margin-top: 0.3em;
  }
  > * {
    width: 100%;
  }
`;
const TaskLabel = styled(Typography.Text)`
  width: 100%;
  font-size: 1.2em;
  flex: 1;
`;

const RowContainer = styled.div`
  display: flex;
  align-items: center;

  gap: 8px;
`;

const colors = {
  completed: "rgba(64, 128, 64, 1)",
  cancelled: "grey",
  missed: "darkred",
  pending: "blue",
  coming: "grey"
};

const icons = {
  completed: CheckOutlined,
  cancelled: MinusOutlined,
  missed: CloseOutlined,
  pending: ExclamationCircleOutlined,
  coming: ClockCircleOutlined
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

  const Icon = icons[mode];

  const tooltip = useMemo(() => {
    switch (mode) {
      case "cancelled":
      case "completed":
        return (
          <Space>
            <span>{event.job?.completionDate?.format("HH:mm")}</span>
            <span>
              {event.job?.participations?.map((participation) => (
                <PersonFromId key={participation.person} person={participation.person} />
              ))}
            </span>
          </Space>
        );
      case "coming":
      case "missed":
      case "pending":
        return undefined;
    }
  }, [mode]);

  return (
    <EventContainer>
      <RowContainer>
        <Popover title={mode} content={tooltip}>
          <Icon style={{color: colors[mode], fontSize: "1.3em"}} />
        </Popover>
        <Hour>{event.date.format("HH:mm")}</Hour>

        <TaskLabel strong>{event.task.label}</TaskLabel>
      </RowContainer>
    </EventContainer>
  );
};

export default FeedEvent;
