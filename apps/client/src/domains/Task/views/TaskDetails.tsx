import React, {useMemo} from "react";

import {useTask} from "src/domains/Task/state";
import {Empty} from "antd";
import TaskFormView from "./Form";
import Involvment from "src/domains/Stats/components/Involvment";
import {useStats} from "src/domains/Stats/state";
import {usePersons} from "src/domains/Person/state";
import {useParams} from "react-router-dom";

const TaskDetails = () => {
  const {id} = useParams();
  const task = useTask(id);
  const stats = useStats();
  const persons = usePersons();

  const taskStats = useMemo(() => {
    return Object.entries(stats).reduce((agg, [person, stats]) => {
      return {
        ...agg,
        [person]: {
          [task.id]: stats[task.id] || 0
        }
      };
    }, {});
  }, [stats]);

  if (!task) {
    return <Empty />;
  }

  return (
    <div>
      <TaskFormView task={task} />
      <Involvment persons={persons} stats={taskStats} />
    </div>
  );
};

export default TaskDetails;
