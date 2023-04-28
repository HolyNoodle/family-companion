import React from "react";
import {selectAllTasks} from "src/domains/Task/state";
import PastJobs from "src/domains/Job/components/PastJobs";
import {useAppSelector} from "src/store";
import {useStats} from "../state";
import {usePersons} from "src/domains/Person/state";
import Involvment from "../components/Involvment";
import {Col, Row} from "antd";

const Dashboard = () => {
  const tasks = useAppSelector(selectAllTasks);
  const stats = useStats() || {};
  const persons = usePersons();

  return (
    <Row gutter={40}>
      <Col xs={24} md={12} lg={6}>
        <Involvment persons={persons} stats={stats} />
      </Col>
      <Col xs={24} md={12} lg={6}>
        <PastJobs tasks={tasks} />
      </Col>
    </Row>
  );
};

export default Dashboard;
