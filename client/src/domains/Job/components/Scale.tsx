import React from "react";
import styled from "styled-components";
import dayjs from "dayjs";

const ScaleContainer = styled.div`
  flex: 1;
`;
const Hour = styled.div<{position: number}>`
  z-index: 0;
  width: 100%;
  position: absolute;
  top: calc(${({position}) => position}% - 0.6em);
  display: flex;
  opacity: 0.5;
  justify-content: center;
  align-items: center;

  > span {
    text-align: center;
    width: 100%;
    font-weight: bold;
    font-size: 0.8em;
    flex: 0 0 2em;
  }
  > hr {
    flex: 1;
  }
`;

export interface HourScaleProps {
  mode: "separator" | "hour";
}

const Scale = ({mode}: HourScaleProps) => {
  const time = new Date();
  time.setHours(0);
  time.setMinutes(0);

  return (
    <ScaleContainer>
      {Array.from({length: 24}, (_, i) => i).map((i: number) => {
        time.setHours(i);

        return (
          <Hour key={i} position={(i / 24) * 100}>
            {mode === "hour" ? <span>{dayjs(time).format("HH:mm")}</span> : <hr />}
          </Hour>
        );
      })}
    </ScaleContainer>
  );
};

export default Scale;
