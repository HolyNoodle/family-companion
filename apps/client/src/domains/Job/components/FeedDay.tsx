import React, {useContext} from "react";
import styled from "styled-components";

import dayjs from "dayjs";
import FeedEvent from "./FeedEvent";
import {Empty} from "antd";
import {TranslatorContext} from "src/context";
import { DateFormat } from "src/utils";
import { EventItem } from "../utils";


const FeedDayContainer = styled.div`
  padding: 1em;
  > h1 {
    text-transform: capitalize;
  }
  > div {
  }
`;

const FeedDay = ({date, events}: {date: Date; events: EventItem[]}) => {
  const {formatDate} = useContext(TranslatorContext);
  return (
    <FeedDayContainer key={dayjs(date).format("DDMMYYYY")}>
      <h1 id={`day_${dayjs(date).format("DDMMYYYY")}`}>{formatDate(date, DateFormat.LONG_DATE)}</h1>
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
