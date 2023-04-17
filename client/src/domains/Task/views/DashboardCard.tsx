import React, {useState} from "react";
import api from "src/api";
import {useAPIData} from "src/utils";
import TaskForm from "../components/Form";
import {Task, WithId} from "src/types";

const DashboardCard = () => {
  const [submitting, setSubmitting] = useState(false);
  const {
    state: {data},
    invalidate
  } = useAPIData(api.getTasks);

  const handleDeleteTask = async (task: WithId<Task>) => {
    await api.deleteTask(task.id);
    invalidate();
  }
  const handleFormSubmit = async (task: Task) => {
    setSubmitting(true);

    try {
      await api.pushTask(task);

      invalidate();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ul>
        {data?.map((task) => (
          <li key={task.id}>{task.label} <button onClick={() => handleDeleteTask(task)}>delete</button></li>
        ))}
      </ul>
      <TaskForm onSubmit={handleFormSubmit} submitting={submitting} />
    </>
  );
};

export default DashboardCard;
