import React from "react";
import styled from "styled-components";
import {Task, WithId} from "src/types";

export interface EventItem {
  date: Date;
  task: WithId<Task>;
}

const EventContainer = styled.div`
  font-size: 0.9em;
  border: 1px solid rgba(0, 0, 0, 0.3);
`;

export interface EventProps {
  event: EventItem;
}

const EventCard = ({event}: EventProps) => {
  return <EventContainer>{event.task.label}</EventContainer>;
};

export default EventCard;
