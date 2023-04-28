import React, {useState} from "react";

import {useAppDispatch} from "src/store";

import {fetchTasks} from "src/domains/Task/state";
import TaskForm from "src/domains/Task/components/Form";
import {Task} from "@famcomp/common";
import api from "src/api";
import {useNavigate} from "react-router-dom";

const TaskFormView = ({task}: {task?: Task}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (newTask: Task) => {
    setSubmitting(true);
    try {
      await api.pushTask(newTask);
      dispatch(fetchTasks());

      if (!task) {
        navigate("/tasks");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return <TaskForm task={task} submitting={submitting} onSubmit={handleSubmit} />;
};

export default TaskFormView;
