import {useMemo} from "react";
import api from "src/api";
import {useAPIData} from "src/utils";
import Day from "../components/Day";
import React from "react";

const Week = () => {
  const startWeek = useMemo(() => {
    const now = new Date();

    now.setDate(now.getDate() - now.getDay());
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now;
  }, []);
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 7);

  const {
    state: {data = []}
  } = useAPIData(api.getSchedule, startWeek, endWeek);

  const days = useMemo(() => {
    return Array.from({length: 7}, (_, i) => i).map((i: number) => {
      const day = new Date(startWeek);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [startWeek]);

  return (
    <>
      {days.map((date) => (
        <Day key={date.toISOString()} events={data} date={date} />
      ))}
    </>
  );
};

export default Week;
