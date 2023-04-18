import React from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { Affix } from "antd";

export interface DayContainerProps {
  date: Date;
  header?: boolean;
  children: any;
}

const Container = styled.div<{flex?: number}>`
  height: 100%;
  & + & {
    border-left: 1px solid black;
  }
  display: flex;
  flex-direction: column;
  flex: ${({flex = 1}) => (flex === 1 ? "1" : "0 0 3em")};
`;

const Header = styled.div`
  flex: 0;
  height: 3em;
  text-align: center;
  padding: 1em;

  > div {
    display: inline-block;
  }
`;
const Schedule = styled.div`
  position: relative;
  flex: 1;
`;

const DayContainer = ({date, children, header = true}: DayContainerProps) => {
  return (
    <Container flex={header ? 1 : 0}>
      <Affix offsetTop={0}>
        <Header>{(header && dayjs(date).format("dddd DD")) || <div></div>}</Header>
      </Affix>
      <Schedule>{children}</Schedule>
    </Container>
  );
};

export default DayContainer;
