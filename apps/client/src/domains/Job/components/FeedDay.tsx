import React from "react";
import styled from "styled-components";

import dayjs from "dayjs";
import {EventItem} from "./Event";
import FeedEvent from "./FeedEvent";
import {Empty} from "antd";

require("dayjs/locale/fr");

const FeedDayContainer = styled.div`
  padding: 1em;
  > h1 {
    text-transform: capitalize;
  }
  > div {
  }
`;

const FeedDay = ({date, events}: {date: Date; events: EventItem[]}) => {
  return (
    <FeedDayContainer key={dayjs(date).format("DDMMYYYY")}>
      <h1 id={`day_${dayjs(date).format("DDMMYYYY")}`}>
        {dayjs(date).locale("fr").format("dddd DD MMMM")}
      </h1>
      <div>
        {events.length === 0 && <Empty />}
        {events.map((event) => (
          <FeedEvent key={event.task.id + event.date.toISOString()} event={event} />
        ))}
      </div>
    </FeedDayContainer>
  );
};

export default FeedDay;
