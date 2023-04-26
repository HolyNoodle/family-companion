import React from "react";
import {useSelector} from "react-redux";

import {selectAllTasks} from "src/domains/Task/state";
import PastJobs from "src/domains/Job/components/PastJobs";

const Dashboard = () => {
  const tasks = useSelector(selectAllTasks);
  return <PastJobs tasks={tasks} />;
};

export default Dashboard;
