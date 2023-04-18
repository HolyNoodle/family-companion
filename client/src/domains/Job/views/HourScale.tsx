import React from "react";
import DayContainer from "../components/DayContainer";
import Scale from "../components/Scale";

const HourScale = () => {
  const time = new Date();
  time.setHours(0);
  time.setMinutes(0);

  return (
    <DayContainer date={time} header={false}>
      <Scale mode="hour" />
    </DayContainer>
  );
};

export default HourScale;
