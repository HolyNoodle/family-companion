import React from "react";
import {Task} from "@famcomp/common";
import {useDayRange, useEvents} from "src/domains/Job/utils";
import styled from "styled-components";
import FeedDay from "./FeedDay";

const LOG_SIZE = 48;

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
  overflow-y: visible;
`;

const PastJobs = ({tasks}: {tasks: Task[]}) => {
  const start = new Date();
  start.setDate(start.getDate() - LOG_SIZE);
  const events = useEvents(tasks, start, new Date());
  const days = useDayRange(start, LOG_SIZE).reverse();

  return (
    <FeedContainer>
      {days.map((date) => {
        const dayEvents = events
          .filter((e) => e.date.isSame(date, "day"))
          .sort((a, b) => b.date.utcOffset() - a.date.utcOffset());

        return <FeedDay events={dayEvents} date={date} />;
      })}
    </FeedContainer>
  );
};

export default PastJobs;
