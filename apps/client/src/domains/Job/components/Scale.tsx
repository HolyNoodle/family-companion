import React, {MouseEventHandler, useMemo} from "react";
import styled from "styled-components";
import dayjs from "dayjs";

const ScaleContainer = styled.div`
  flex: 1;
  height: 100%;
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
  date: Date;
  onClick?: (date: Date) => void;
}

const Scale = ({date, mode, onClick}: HourScaleProps) => {
  const time = useMemo(() => {
    const time = new Date(date);
    time.setHours(0);
    time.setMinutes(0);

    return time;
  }, [date]);

  const handleScaleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!onClick) {
      return;
    }

    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    const timeInMinutes = ((event.clientY - rect.top) / rect.height) * 1440;

    const date = new Date(time);
    date.setHours(timeInMinutes / 60);
    date.setMinutes(timeInMinutes % 60);

    onClick(date);
  };

  return (
    <ScaleContainer onClick={handleScaleClick}>
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
